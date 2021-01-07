const { ApolloServer, gql, AuthenticationError, UserInputError } = require('apollo-server')
const mongoose = require('mongoose')
const Book = require('./models/book')
const Author = require('./models/author')
const User = require('./models/user')
const { PubSub } = require('apollo-server')
const pubsub = new PubSub()

const jwt = require('jsonwebtoken')

const JWT_SECRET = 'a4098thnalfdgjalgioetu'

let MONGODB_URI = process.env.MONGODB_URI

console.log('connecting to', MONGODB_URI)

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

const typeDefs = gql`

  type Subscription {
    bookAdded: Book!
  } 

  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Book {
    title: String!
    author: String!
    published: String!
    genres: [String]
    id: ID!
  }

  type Author {
    name: String
    id: String
    born: String
  }

  type Authors {
    name: String!
    bookCount: Int!
    id: String!
    born: String
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(genre: String, author: String) : [Book]
    allAuthors: [Authors!]!
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: String!
      genres: [String]
    ) : Book
  
    editAuthor(
      name: String!
      year: String!
    ) : Author

    createUser(
      username: String!
    ): User
  
    login(
      username: String!
      password: String!
    ): Token

    addAsFriend(
      name: String!
    ): User
  }
`
const resolvers = {
  Query: {
    bookCount: async () => await Book.find({}).length,
    authorCount: () => authors.length,
    allBooks: async (root, args) => {
      let result = []
      if(args.author) 
        result = await Book.find({ author: args.author }).populate('friendOf')
      else if(args.genre)
        result = await Book.find({genres: { $all: [args.author] }}).populate('friendOf')
      else
        result = await Book.find({}).populate('friendOf')

      return result
    },
    allAuthors: async () => { 
      const authors = await Author.find({}).populate('friendOf')
      return authors
    },
    me: (root, args, context) => {
      return context.currentUser
    }
  },

  Mutation: {
    addBook: async (root, args, context) => {
      console.log(args)

      const book = new Book({ ...args })
      const currentUser = context.currentUser

      if (!currentUser) {
        throw new AuthenticationError("not authenticated")
      }
      try {
        book.save()
        currentUser.friends = currentUser.friends.concat(book)
        currentUser.save()
      } catch(error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }
      
      const result = await Author.findOne({ name: args.author })
      if(!result)
      {
        const author = new Author({name: args.author})
        author.save()
      }

      pubsub.publish('BOOK_ADDED', { bookAdded: book })
      return book
    },

    editAuthor: async (root, args, context) => {
      const author = await Author.findOne({ name: args.name })

      console.log('cotext: ' ,  context)

      const currentUser = context.currentUser

      if (!currentUser) {
        throw new AuthenticationError("not authenticated")
      }
      try {
      console.log("found : " , author)
      if(author)
      {
        author.born = args.year
        return author.save()
      }
    } catch(error) {
        throw new UserInputError(error.message, {
        invalidArgs: args,
      })
    }
    return author
    },

    createUser: (root, args) => {
      const user = new User({ username: args.username })
  
      return user.save()
        .catch(error => {
          throw new UserInputError(error.message, {
            invalidArgs: args,
          })
        })
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })

      console.log('login args: ' , args)
  
      if ( !user || args.password !== 'secret' ) {
        throw new UserInputError("wrong credentials")
      }

      console.log('user: ' , user)
  
      const userForToken = {
        username: user.username,
        id: user._id,
      }
  
      return { value: jwt.sign(userForToken, JWT_SECRET) }
    },


    addAsFriend: async (root, args, { currentUser }) => {
      const nonFriendAlready = (author) => 
        !currentUser.friends.map(f => f._id).includes(author._id)
  
      if (!currentUser) {
        throw new AuthenticationError("not authenticated")
      }
  
      const author = await Author.findOne({ name: args.name })
      if ( nonFriendAlready(author) ) {
        currentUser.friends = currentUser.friends.concat(author)
      }

      const book = await Book.findOne({ author: args.name })
      if ( nonFriendAlready(book) ) {
        currentUser.friends = currentUser.friends.concat(book)
      }
  
      await currentUser.save()
  
      return currentUser
    },
  },

  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED'])
    },
  },

  Authors: {
    bookCount: async (root) => {
    
      const c = await Book.find({author: root.name})
      
      return c.length
    }
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    console.log('getting context : ' , req.headers)
    const auth = req ? req.headers.authorization : null
    console.log('auth: ' , auth)
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7), JWT_SECRET
      )
      
      const currentUser = await User.findById(decodedToken.id).populate('friends')
      console.log('decodedToken: ' , decodedToken)
      console.log('currentUser: ' , currentUser)
      return { currentUser }
    }
  }
})

server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`Server ready at ${url}`)
  console.log(`Subscriptions ready at ${subscriptionsUrl}`)
})