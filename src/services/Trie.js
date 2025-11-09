class TrieNode {
    constructor() {
        this.children = {};             // Map of next characters
        this.isEndofWord = false;
        this.data = [];                // store restaurant objects that match this prefix
    } 
}


class Trie {
    constructor() {
        this.root = new TrieNode();
    }

    insert(word, restaurantData) {
        let node = this.root;
        for(const char of word.toLowerCase()) {
            if(!node.children[char]) {
                node.children[char] = new TrieNode();
            }

            node = node.children[char];

            // store data at each prefix (optional for prefix search)
            node.data.push(restaurantData);
        }

        node.isEndofWord = true;
    }

    search(prefix) {
        let node = this.root;
        for(const char of prefix.toLowerCase()) {
            if(!node.children[char]) return[];
            node = node.children[char];
        }

        return node.data;
    }
}


module.exports = { Trie, TrieNode };