const { Client } = require("@elastic/elasticsearch");
const util = require('util');

const client = new Client({ node: 'http://localhost:9200' });
client.on('request', (err, result) => {
    console.log('request', util.inspect(JSON.parse(result.meta.request.params.body), false, null, true));
});

module.exports = client;