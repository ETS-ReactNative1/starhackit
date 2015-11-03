import _ from 'lodash';

let env = process.env;

let config = {

    general: {
        title: 'StarHackIt',
        description: 'StarHackIt is a fullstack boilerplate written in es6/es7',
        apiUrl: '/api/v1/'
    },

    development: {

    },

    production: {

    }
};

export default _.extend( {}, config.general, config[ env.NODE_ENV ] );
