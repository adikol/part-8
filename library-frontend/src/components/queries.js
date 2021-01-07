import { gql  } from '@apollo/client'

export const BOOK_ADDED = gql`
  subscription {
    bookAdded {
      author
      title
      published
    }
  }
`

export const ALL_AUTHORS = gql`
query {
  allAuthors  {
    born
    name
    bookCount
  }
}
`

export const ALL_BOOKS = gql`
query {
  allBooks {
    author
    title
    published
  }
}
`

export const CREATE_BOOK = gql`
mutation createBook($title: String!, $published: String!, $author: String!, $genres: [String]) {
  addBook(
    title: $title,
    published: $published,
    author: $author,
    genres: $genres
  ) {
    title
    published
    author
    genres
  }
}
`

export const EDIT_AUTHOR = gql`
  mutation editAuthor($name: String!, $year: String!) {
    editAuthor(name: $name, year: $year)  {
      name
      born
    }
  }
`

export const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password)  {
      value
    }
  }
`

export const CREATE_USER = gql`
  mutation createUser($username: String!) {
    createUser(username: $username)  {
      username
    }
  }
`

