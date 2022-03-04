const path = require('path'); // core module for path name
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit'); // 3rd party module limiting login attemts from a one IP addres.
const helmet = require('helmet'); // 3rd party module for setting HTTP headers.
const mongoSanitize = require('express-mongo-sanitize'); //3rd party module for sanitize data from mongoDB
const xss = require('xss-clean'); //3rd party module for Data sanitization against XSS(Cross Site Scripting) attack
const hpp = require('hpp'); // 3rd party module for Prevent parameter pollution
const cookieParser = require('cookie-parser'); //a middleware to parse cookies
const bodyParser = require('body-parser');
const compression = require('compression'); // 3rd party module for decreases the downloadable amount of data that's served to users. Through the use of this compression, we can improve the performance of our Node. js applications as our payload size is reduced drastically
const cors = require('cors'); // (Cross-Origin Resource Sharing)3rd party middleware funtion . It is a mechanism to allow or restrict requested resources on a web server depend on where the HTTP request was initiated. This policy is used to secure a certain web server from access by other website or domain.

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const viewRouter = require('./routes/viewRoutes');

// Start express app
const app = express();

app.enable('trust proxy'); // built in express method. We have to use this because heroku acts as a proxy and redirect, modifies incomign requests

app.set('view engine', 'pug'); // setting up for view engine in pug templets.
app.set('views', path.join(__dirname, 'views')); // sometimes we have a confution time in the address we have "/" or not. by path.join node will take care of it.

// 1) GLOBAL MIDDLEWARES
// Implement CORS
app.use(cors()); //cors() middleware is allowing to access our api from everywhere
// Access-Control-Allow-Origin *
// api.Tour-World.com, front-end Tour-World.com
// app.use(cors({
//   origin: 'https://www.Tour-World.com'
// }))

app.options('*', cors()); // The HTTP OPTIONS method requests permitted communication options for a given URL or server. A client can specify a URL with this method, or an asterisk ( * ) to refer to the entire server.
// app.options('/api/v1/tours/:id', cors());             // 'http://127.0.0.1:3000/api/v1/tours/:id'  our api and this code will live in the same server so this is not a problem. we can remove the localhost from every url

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100, // 100 requests maximum
  windowMs: 60 * 60 * 1000, // window time 1 hour in milisec.
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Stripe webhook, BEFORE body-parser, because stripe needs the body as stream
app.post(
  '/webhook-checkout',
  bodyParser.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);

// Body parser, reading data from body into req.body and limiting file size  // parses the data from body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // parses data from url when we want to update username and email
app.use(cookieParser()); // parses the data from cookies

// Data sanitization against NoSQL query injection. attaker make request with query.
app.use(mongoSanitize()); // it removes " $ and . " then query will not work in MongoDB.

// Data sanitization against XSS(Cross Site Scripting) attack. attacker try to inject maliciours html code with JavaScript to our html.
app.use(xss()); // change html tags to entity code like "< becomes &lt"

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

app.use(compression()); // returns a middleware, works for only text not for images

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// 3) ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  // app.all will execute if we do not find any predifed route by routehandlers, so we want to give a json output not the html   // app.all means all the HTTP method like get(), patch()....and * means all the urls that we did not handle before and then the middleware function (req, res, next). Here app.all should always be after our defiend routes or all of the vallied routes will be failed as well.
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404)); //originalUrl is the propertitry availble on req.
});

app.use(globalErrorHandler);

module.exports = app;
