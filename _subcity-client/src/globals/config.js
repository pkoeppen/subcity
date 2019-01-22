import axios from "axios";
import EventEmitter from "eventemitter3";

const $http = axios.create({
  baseURL: process.env.API_HOST
});

export default {

  $http,

  $bus: new EventEmitter(),

  $config: {
    host: process.env.SPA_HOST,
    dataHost: process.env.DATA_HOST,
    maxLengthShort: 16,
    maxLengthGeneral: 38,
    maxLengthExtended: 76,
    maxLengthDescription: 500,
    maxLengthOverview: 2000,
    slugRegex: new RegExp(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
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