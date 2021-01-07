
import React, { useEffect, useState } from 'react'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import LoginForm from './components/LoginForm'
import { useApolloClient, useSubscription } from '@apollo/client'
import {ALL_BOOKS, BOOK_ADDED} from './components/queries'

const App = () => {
  const [page, setPage] = useState('authors')
  const [errorMessage, setErrorMessage] = useState(null)
  const [token, setToken] = useState(null)

  const notify = (message) => {
    setErrorMessage(message)
    setTimeout(() => {
      setErrorMessage(null)
    }, 10000)
  }

  useEffect(() => {
   setToken(localStorage.getItem('library-user-token'))
  },[])

  const updateCacheWith = (addedBook) => {
    const includedIn = (set, object) => 
      set.map(p => p.id).includes(object.id)

    const dataInStore = client.readQuery({ query: ALL_BOOKS })
    console.log('dataInStore: ', dataInStore)
    if (dataInStore && !includedIn(dataInStore.allBooks, addedBook)) {
      client.writeQuery({
        query: ALL_BOOKS,
        data: { allBooks : dataInStore.allBooks.concat(addedBook) }
      })
    }   
  }

  useSubscription(BOOK_ADDED, {
    onSubscriptionData: ({ subscriptionData }) => {
      const addedBook = subscriptionData.data.bookAdded
      console.log('addedbook, ' , addedBook)
      window.alert(`${addedBook.name} added`)
      updateCacheWith(addedBook)
    }
  })

  const client = useApolloClient()
  const logout = () => {
    setToken(null)
    localStorage.clear()
    client.resetStore()
  }

  const Notify = ({errorMessage}) => {
    if ( !errorMessage ) {
      return null
    }
    return (
      <div style={{color: 'red'}}>
      {errorMessage}
      </div>
    )
  }

  if (!token) {
    return (
      <div>
        <Notify errorMessage={errorMessage} />
        <h2>Login</h2>
        <LoginForm
          setToken={setToken}
          setError={notify}
          logout={logout}
        />
      </div>
    )
  }

  return (
    <div>
      <Notify errorMessage={errorMessage} />
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        <button onClick={() => setPage('add')}>add book</button>
        {token &&
          <button onClick={() => logout()}>logout</button>
        }
        {!token &&
          <button onClick={() => setPage('loginform')}>login</button>
        }
      </div>

      <Authors
        setError={notify}
        show={page === 'authors'}
      />

      <Books
        show={page === 'books'}       
      />

     {token &&

      <NewBook
        setError={notify}
        show={page === 'add'}
        updateCacheWith={updateCacheWith}
      />
     }

      {!token &&

      <LoginForm
         setToken={setToken}
         setError={notify}
         show={page === 'add'}
      />
      }

    </div>
  )
}

export default App