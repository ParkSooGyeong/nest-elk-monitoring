export default () => ({
    port: parseInt(process.env.PORT, 10) || 3001,
    email: {
      user: process.env.EMAIL_USER || 'myemail',
      pass: process.env.EMAIL_PASS || 'mypassword',
    },
  });
  