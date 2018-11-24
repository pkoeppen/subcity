import axios from "axios";
import EventEmitter from "eventemitter3";

// This is primarily for S3 signed URLs, as they are extremely picky
// about having any extra headers whatsoever.

const $http = axios.create({
  baseURL: "https://bv4yv4ro09.execute-api.us-east-1.amazonaws.com/dev" //"http://mavhgb4ru0.execute-api.us-east-1.amazonaws.com/dev" 
});

$http.interceptors.request.use(request => {
  console.log('Starting Request', request)
  return request
})

$http.interceptors.response.use(response => {
  console.log('Response:', response)
  return response
})

export default {

  $http,

  $bus: new EventEmitter(),

  $config: {
    host: "http://localhost:3000",
    apiHost: "https://bv4yv4ro09.execute-api.us-east-1.amazonaws.com/dev",
    //dataHost: "http://s3.amazonaws.com",
    maxLengthShort: 16,
    maxLengthGeneral: 38,
    maxLengthExtended: 76,
    maxLengthDescription: 720,
    slugRegex: new RegExp(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  },

  $getHeaders() {
    const accessToken = localStorage.getItem("access_token") || null;
    const headers = {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=utf-8"
    };
    return headers;
  }
};