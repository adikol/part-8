import React, {useEffect} from 'react'
import { useLazyQuery } from '@apollo/client'
import {ALL_BOOKS} from './queries'


const Books = (props) => {
  const [getBooks, result] = useLazyQuery(ALL_BOOKS)

  const books = result && result.data ? result.data.allBooks : null

  useEffect(() => {
    if(props.show)
      getBooks()
  },[props.show, getBooks])

  if (!props.show || !books) {
    return null
  }

  if (books.loading) {
    return <div>loading...</div>
  }

  return (
    <div>
      <h2>books</h2>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>
              author
            </th>
            <th>
              published
            </th>
          </tr>
          {books.map(a =>
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author}</td>
              <td>{a.published}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Books