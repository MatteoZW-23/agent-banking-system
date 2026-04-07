console.log(
  JSON.stringify(
    {
      DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET",
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      VITE_AUTH_CLIENT_ID: process.env.VITE_AUTH_CLIENT_ID ? "SET" : "NOT SET",
      AUTH_SERVER_URL: process.env.AUTH_SERVER_URL ? "SET" : "NOT SET",
      SERVICE_BASE_URL: process.env.SERVICE_BASE_URL ? "SET" : "NOT SET",
    },
    null,
    2
  )
);
