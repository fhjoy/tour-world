/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({ // for http/ajax request promise based
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,                // email : email Here email is field in postman for our api and the 2nd email is the argument
        password
      }
    });

    if (res.data.status === 'success') {  // if the status is is successful set an alert and load the page
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');              // for loading the page
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout'
    });
    if ((res.data.status = 'success')) location.reload(true);
  } catch (err) {
    console.log(err.response);
    showAlert('error', 'Error logging out! Try again.');
  }
};
