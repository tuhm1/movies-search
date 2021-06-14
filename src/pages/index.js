import axios from 'axios';
import React, { Fragment, useState } from 'react';
import client from '../elasticsearch';

export async function getServerSideProps({ }) {
  const languages = await client.search({
    index: 'movies',
    body: {
      aggs: {
        languages: {
          terms: {
            field: 'languages.keyword',
            size: 10000
          }
        }
      }
    }
  });
  const genres = await client.search({
    index: 'movies',
    body: {
      aggs: {
        genres: {
          terms: {
            field: 'genres.keyword',
            size: 10000
          }
        }
      }
    }
  });
  return {
    props: JSON.parse(JSON.stringify({
      languages,
      genres
    }))
  }
}
export default function Home({ languages, genres, }) {
  const [result, setResult] = useState();
  const onSearch = params => {
    axios.post('/api/search', params)
      .then(res => {
        setResult(res.data);
      });
  }
  return <div>
    {result
      ? <Result {...result} onBack={() => setResult(null)} />
      : <SearchForm onSearch={onSearch} languages={languages} genres={genres} />
    }
  </div>
}

function SearchForm({ onSearch, languages, genres }) {
  const [showAdvance, setShow] = useState(false);
  const [text, setText] = useState('');
  const [selectedGenres, setSelectedGenres] = useState({});
  const [selectedLanguages, setSelectedLanguges] = useState({});
  const onSubmit = e => {
    e.preventDefault();
    onSearch({
      query: text,
      languages: selectedLanguages,
      genres: selectedGenres
    });
  };
  return <div className='d-flex align-items-center justify-content-center' style={{ minHeight: '100vh' }}>
    <form onSubmit={onSubmit} style={{ maxWidth: '800px', width: '100%' }}>
      <h1>Movies Search</h1>
      <div className='d-flex'>
        <input className='form-control' type='text' value={text}
          onChange={e => setText(e.target.value)} placeholder='Search movies...'
        />
        <button type='submit' className='btn btn-primary'>Search</button>
      </div>
      <button type='button' className='btn btn-secondary'
        style={{ marginTop: '10px' }}
        onClick={() => setShow(!showAdvance)}
      >
        {showAdvance ? 'Hide' : 'Advance'}
      </button>
      {showAdvance && <div style={{ marginTop: '10px' }}>
        <h4>Filter</h4>
        <div>
          <h5>Genres</h5>
          <div className='row' style={{ maxHeight: '50vh', overflow: 'auto' }}>
            {genres.body.aggregations.genres.buckets.map(({ key }) =>
              <div className='col-3' key={key}>
                <label>
                  <input
                    type='checkbox'
                    checked={!!selectedGenres[key]}
                    onChange={e => setSelectedGenres({ ...selectedGenres, [key]: !selectedGenres[key] })}
                  />
                  {key}
                </label>
              </div>
            )}
          </div>
        </div>
        <div>
          <h5>Languages</h5>
          <div className='row' style={{ maxHeight: '50vh', overflow: 'auto' }}>
            {languages.body.aggregations.languages.buckets.map(({ key }) =>
              <div className='col-3' key={key}>
                <label>
                  <input type='checkbox'
                    checked={!!selectedLanguages[key]}
                    onChange={e => setSelectedLanguges({ ...selectedLanguages, [key]: !selectedLanguages[key] })}
                  />
                  {key}
                </label>
              </div>
            )}
          </div>
        </div>
      </div>}
    </form>
  </div>
}

function Result({ hits, onBack, }) {
  return <div className='container d-flex justify-content-center'>
    <div style={{ maxWidth: '800px', width: '100%' }}>
      <div style={{ position: 'sticky', top: 0 }}>
        <button className='btn btn-secondary' onClick={onBack}>Back</button>
      </div>
      <h2>{hits.total.value < 10000 ? hits.total.value : '9999+'} Results</h2>
      <div>
        {hits.hits.map(hit =>
          <Fragment key={hit._id}>
            <MovieSearchItem {...hit} />
            <hr />
          </Fragment>
        )}
      </div>
    </div>
  </div>
}

function MovieSearchItem({ _source, highlight }) {
  return <div>
    {highlight?.title
      ? <div dangerouslySetInnerHTML={{ __html: `<b>Title</b>: ${highlight.title}` }} />
      : <div><b>Title</b>: {_source.title}</div>
    }
    <div><b>Released Date</b>: {new Date(_source.released_date).toLocaleDateString()}</div>
    {highlight?.rating
      ? <div dangerouslySetInnerHTML={{ __html: `<b>Rating</b>: ${highlight.rating}` }} />
      : (_source.rating && <div><b>Rating</b>: {_source.rating}</div>)
    }
    {highlight?.storyline
      ? <div dangerouslySetInnerHTML={{ __html: `<b>Storyline</b>: ${highlight.storyline}` }} />
      : (_source.storyline && <div><b>Storyline</b>: {_source.storyline}</div>)
    }
    {highlight?.genres
      ? <div dangerouslySetInnerHTML={{ __html: `<b>Genres</b>: ${highlight.genres}` }} />
      : (_source.genres?.length > 0
        && <div><b>Genres</b>: {_source.genres?.map((g, i) =>
          <Fragment key={g}>
            <span key={g}>{g}</span>
            {i < _source.genres.length - 1 && ', '}
          </Fragment>
        )}</div>)
    }
    {highlight?.languages
      ? <div dangerouslySetInnerHTML={{ __html: `<b>Languages</b>: ${highlight.languages}` }} />
      : (_source.languages?.length > 0
        && <div><b>Languages</b>: {_source.languages?.map((l, i) =>
          <Fragment key={l}>
            <span key={l}>{l}</span>
            {i < _source.languages.length - 1 && ', '}
          </Fragment>
        )}</div>)
    }
    {highlight?.directors
      ? <div dangerouslySetInnerHTML={{ __html: `<b>Directors</b>: ${highlight.directors}` }} />
      : (_source.directors?.length > 0
        && <div><b>Directors</b>: {_source.directors.map((d, i) =>
          <Fragment key={d}>
            <span>{d}</span>
            {i < _source.directors.length - 1 && ', '}
          </Fragment>
        )}</div>
      )
    }
    {highlight?.writers
      ? <div dangerouslySetInnerHTML={{ __html: `<b>Writers</b>: ${highlight.writers}` }} />
      : (_source.writers?.length > 0
        && <div><b>Writers</b>: {_source.writers.map((w, i) =>
          <Fragment key={w}>
            <span>{w}</span>
            {i < _source.writers.length - 1 && ', '}
          </Fragment>
        )}</div>
      )
    }
    {highlight?.cast
      ? <div dangerouslySetInnerHTML={{ __html: `<b>Cast</b>: ${highlight.cast}` }} />
      : (_source.cast?.length > 0
        && <div><b>Cast</b>: {_source.cast?.map((c, i) =>
          <Fragment key={c}>
            <span key={c}>{c}</span>
            {i < _source.cast.length - 1 && ', '}
          </Fragment>
        )}</div>)
    }
  </div>
}