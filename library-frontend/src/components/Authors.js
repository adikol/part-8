import React, { useEffect, useState } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client'
import {ALL_AUTHORS, EDIT_AUTHOR} from './queries'
import Select from 'react-select'

const Authors = (props) => {
  const [name, setName] = useState('')
  const [year, setYear] = useState('')

  const [getAuthors, authorsResult] = useLazyQuery(ALL_AUTHORS)
  const [changeAuthor,result] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [ { query: ALL_AUTHORS } ],
    onError: (error) => {
      props.setError(error.graphQLErrors[0].message)
    }
  })

  const authors = authorsResult && authorsResult.data ? authorsResult.data.allAuthors : null
  
  const submit = (event) => {
    event.preventDefault()

    changeAuthor({ variables: { name, year } })

    setName('')
    setYear('')
  }

  useEffect(() => {
    if(props.show)
      getAuthors()
  },[props.show, getAuthors])

  useEffect(() => {
    if (result.data && result.data.editAuthor === null) {
      props.setError('author not found')
    }
  }, [result.data]) // eslint-disable-line

  const authorEditForm = () => {

  const getOptions = () => {
      let items = []
      for (let i = 0; i < authors.length; i++) {             
        items.push({label: authors[i].name, value: authors[i].name})
      } 
      return items
  }

  const handleChange = selected => {
    setName(selected.value)
  }

    return(
      <div>
        <h2>change author</h2>
        <Select
          value={name}
          onChange={handleChange}
          options={getOptions()}
        />
        <form onSubmit={submit}>
            <div>
              year <input
                value={year}
                onChange={({ target }) => setYear(target.value)}
              />
            </div>
            <button type='submit'>change year</button>
        </form>
      </div>
    )
  }

  if (!props.show || !authors) {
    return null
  }

  if (authors.loading)  {
    return <div>loading...</div>
  }

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>
              born
            </th>
            <th>
              books
            </th>
          </tr>
          {authors.map(a =>
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          )}
        </tbody>
      </table>

      {authorEditForm()}
    </div>
  )
}

export default Authors
