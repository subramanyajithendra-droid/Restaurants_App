// const { Client } = require('@elastic/elasticsearch')

// const client = new Client({ 
//     node: 'http://localhost:9200'
// })                                                       // default local Elasticsearch

// async function checkConnection() {
//     try {
//         const health = await client.cluster.health({})
//         console.log('ELasticsearch cluster is healthy:', health)
        
//         const res = await client.count({ index: 'restaurants' });
//         console.log(`Total restaurants indexed: ${res.count}`);
//     } catch(err) {
//         console.error('Elasticsearch connection error:', err);
//     }
// }

// checkConnection()

// module.exports = client;