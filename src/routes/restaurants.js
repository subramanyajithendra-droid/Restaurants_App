const Restaurant = require('../Models/restaurantModel'); // ✅ make sure path and case are correct
const client = require('../elasticSearch')

const { RestaurantTrie } = require('../services/TrieLoader')


async function restaurantRoutes(fastify, options) {

  fastify.get('/restaurants/autocomplete', {
    schema: {
      tags: ['Restaurants'],
      summary: 'Autocomplete suggestions for restaurants and cuisines',
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string' },
          limit: { type: 'integer', default: 10 }
        }
      }
    },

    handler: async (req, reply) => {
      const { q = '', limit = 10 } = req.query;
      if (!q) return reply.send({ total: 0, data: [] });

      const results = RestaurantTrie.search(q.toLowerCase());
      const cuisinesSet = new Set();
      const restaurantMap = new Map();

      results.forEach(r => {
        if (!r || !r.name) return;

        // cuisines
        if (r.type === 'cuisine' && r.name.toLowerCase().includes(q.toLowerCase())) {
          cuisinesSet.add(r.name.trim());
        }

        // restaurants
        if (r.type === 'restaurant') {
          if (
            r.name.toLowerCase().includes(q.toLowerCase()) ||
            (r.cuisines && r.cuisines.toLowerCase().includes(q.toLowerCase()))
          ) {
            restaurantMap.set(r._id, {
              _id: r._id,
              name: r.name,
              cuisines: r.cuisines || '',
              rate: r.rate || 0,
              location: r.location || '',
              type: 'restaurant'
            });
          }

          // also pick cuisines matching query
          if (r.cuisines) {
            r.cuisines.split(',').map(c => c.trim()).forEach(cuisine => {
              if (cuisine.toLowerCase().includes(q.toLowerCase())) {
                cuisinesSet.add(cuisine);
              }
            });
          }
        }
      });

      const cuisines = Array.from(cuisinesSet).map(c => ({ name: c, type: 'cuisine' }));
      const restaurants = Array.from(restaurantMap.values());
      const merged = [...cuisines, ...restaurants].slice(0, limit);

      reply.send({ total: merged.length, data: merged });
    }
  });


  fastify.get('/restaurants/by-cuisine', {
  schema: {
    tags: ['Restaurants'],
    summary: 'Get restaurants by cuisine',
    description: 'Fetch restaurants filtered by cuisine name with pagination support',
    querystring: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, description: 'Cuisine name (e.g., Chinese)' },
        page: { type: 'integer', minimum: 1, default: 1, description: 'Page number' },
        limit: { type: 'integer', minimum: 1, maximum: 50, default: 10, description: 'Results per page' }
      },
      required: ['name']
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          pagination: {
            type: 'object',
            properties: {
              totalRecords: { type: 'integer' },
              totalPages: { type: 'integer' },
              currentPage: { type: 'integer' },
              limit: { type: 'integer' }
            }
          },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                location: { type: 'string' },
                address: { type: 'string' },
                cuisines: { type: 'string' },
                rate: { type: 'string' },
                votes: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  },

  handler: async (req, reply) => {
    const { name, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    try {
      const regex = new RegExp(name.trim(), 'i');
      
      // Count first for pagination
      const totalRecords = await Restaurant.countDocuments({ cuisines: regex });

      // Paginated query
      const restaurants = await Restaurant.find({ cuisines: regex })
        .skip(skip)
        .limit(limit)
        .sort({ name: 1 }) // optional alphabetical sort
        .lean();

      const totalPages = Math.ceil(totalRecords / limit);

      return reply.send({
        success: true,
        pagination: {
          totalRecords,
          totalPages,
          currentPage: page,
          limit
        },
        data: restaurants.map(r => ({
          _id: r._id,
          name: r.name,
          location: r.location || '',
          address: r.address || '',
          cuisines: r.cuisines || '',
          rate: r.rate || r.rateNum || 'N/A',
          votes: r.votes || r.votesNum || 0
        }))
      });
    } catch (err) {
      req.log.error({ err }, 'Error fetching restaurants by cuisine');
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error'
      });
    }
  }
});




  // 1️⃣ Main route for filtering, sorting, and pagination
  fastify.get('/restaurants', {
    schema: {
      tags: ['Restaurants'],
      summary: 'List restaurants with filtering, sorting & pagination',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 10 },
          sort: { type: 'string' }, // votes_asc, votes_desc, rate_asc, rate_desc
          filters: { type: 'string' } // JSON encoded filters object
        }
      }
    },
    handler: async (req, reply) => {
      let { page = 1, limit = 10, sort, filters } = req.query;

      // MongoDB filter object
      const filterQuery = {};

      // ✅ Parse filters from frontend
      if (filters) {
        try {
          const filterObj = JSON.parse(filters);
          console.log('filterObj:', filterObj)

          Object.entries(filterObj).forEach(([field, values]) => {
            if (['cuisines', 'rest_type'].includes(field)) {
              filterQuery[field] = { $regex: values.join('|'), $options: 'i' };
            } else {
              filterQuery[field] = { $in: values };
            }
          });
        } catch (err) {
          console.error("Invalid filters format", err);
        }
      }
      console.log('selected filters:', filterQuery)

      // ✅ Sorting logic using pre-computed numeric fields
      let sortStage = {};
      if (sort) {
        const [key, order] = sort.split('_');
        const direction = order === 'asc' ? 1 : -1;
        if (key === 'rate') {
          sortStage = { rateNum: direction };
        } else if (key === 'votes') {
          sortStage = { votesNum: direction };
        } else {
          sortStage = { [key]: direction };
        }
      }
      console.log('selected sort:', sortStage)

      // ✅ Query without $addFields (faster)
      const total = await Restaurant.countDocuments(filterQuery);
      console.log('total:', total)
 
      const data = await Restaurant.find(filterQuery)
        .sort(sortStage)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(); // faster, returns plain objects

      return { total, page, limit, data };
    }
  });

  // 2️⃣ Filter options for frontend
  fastify.get('/restaurants/filters', {                                         //to load filter options 
    schema: {
      tags: ['Restaurants'],
      summary: 'Get unique filter values from all restaurants'
    },
    handler: async () => {
      const filterableFields = [
        'online_order',
        'book_table',
        'location',
        'rest_type',
        'cuisines'
      ];

      const filters = {};
      for (const field of filterableFields) {
        let values = await Restaurant.distinct(field, { [field]: { $ne: null } });

        // Split and trim for multi-value fields
        values = values.flatMap(v => {
          if (typeof v === 'string') {
            if (field === 'cuisines' || field === 'rest_type') {
              return v.split(',').map(s => s.trim());
            }
            return [v.trim()];
          }
          return [];
        });

        // Unique values, sorted
        filters[field] = Array.from(new Set(values)).filter(Boolean).sort();
      }
      // console.log('loaded filters:', filters)            
      return filters;
    }
  });

  fastify.get('/restaurants/search', {
    schema: {
      tags: ['Restaurants'],
      summary: 'Search Restaurants',
      querystring: {
        type: 'object',
        properties: {
          page: {type: 'integer', default: 1},
          limit: {type: 'integer', default: 10},
          q: {type: 'string'}
        }
      }
    },
    handler: async(req, reply) => {
      const { page = 1, limit = 10, q} = req.query

      try {

        // Query setup
        const esQuery = q
          ? {
              bool: {
                should: [
                  { wildcard: { name: `*${q.toLowerCase()}*` } },      // case-insensitive if field is lowercase in index
                  { wildcard: { cuisines: `*${q.toLowerCase()}*` } }

                //   { wildcard: { "name.keyword": `*${q.toLowerCase()}*` } }, 
                // { wildcard: { "cuisines.keyword": `*${q.toLowerCase()}*` } }
                ],
                minimum_should_match: 1
              }
            }
          : { match_all: {} };

        // Run Elasticsearch search
        const result = await client.search({
          index: 'restaurants',
          from: (page-1)*limit,
          size: limit * 3, // fetch more, so after deduplication we still have enough
          query: esQuery,
        });

        // Deduplicate based on restaurant name
        const uniqueHits = Array.from(
          new Map(
            result.hits.hits.map(hit => [hit._source.name, hit._source])
          ).values()
        );

        // const hits = result.hits.hits.map(hit => hit._source)

        const total = uniqueHits.length
        console.log('total:', total)

        const paginatedData = uniqueHits.slice((page-1) * limit, page * limit)

        return { total, page, limit, data: paginatedData };
      } catch(err) {
        console.error(err);
        reply.status(500).send({ error: 'Search failed' });
      }
    }
  });

}

module.exports = restaurantRoutes;
