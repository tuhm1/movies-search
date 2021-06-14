import client from '../../elasticsearch';

export default async function search(req, res) {
    const query = req.body.query;
    const must = query
        ? {
            multi_match: {
                query,
                fields: ['title^1.3', 'storyline^1.1', 'genres', 'languages', 'directors^1.2', 'writers^1.2', 'cast^1.2']
            }
        }
        : { match_all: {} };
    const should = query
        ? [
            { term: { 'title.keyword': { value: query, boost: 2.1 } } },
            { term: { 'directors.keyword': { value: query, boost: 2 } } },
            { term: { 'writers.keyword': { value: query, boost: 2 } } },
            { term: { 'cast.keyword': { value: query, boost: 2 } } },
        ]
        : [];
    const filter = [];
    const genres = Object.entries(req.body.genres)
        .filter(([key, value]) => value)
        .map(([key, value]) => key);
    if (genres.length > 0) {
        filter.push({ terms: { 'genres.keyword': genres } });
    }
    const languages = Object.entries(req.body.languages)
        .filter(([key, value]) => value)
        .map(([key, value]) => key);
    if (languages.length > 0) {
        filter.push({ terms: { 'languages.keyword': languages } });
    }
    const searchResult = await client.search({
        index: 'movies',
        body: {
            query: {
                bool: {
                    must,
                    filter,
                    should
                }
            },
            sort: [
                '_score',
                { rating: 'desc' },
                { released_date: 'asc' }
            ],
            highlight: {
                fields: {
                    'title': {},
                    'storyline': {},
                    'genres': {},
                    'languages': {},
                    'directors': {},
                    'writers': {},
                    'cast': {}
                },
                pre_tags: ['<mark style="background:yellow">'],
                post_tags: ['</mark>']
            },
            size: 10000
        }
    })
    res.json(searchResult.body);
}