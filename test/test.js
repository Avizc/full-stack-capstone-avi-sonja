'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
//const faker = require('faker');
const{PORT, TEST_DATABASE} = require('../config');


const knex = require('knex')(TEST_DATABASE);
//console.log(TEST_DATABASE_URL);

// this makes the should syntax available throughout
// this module
const should = chai.should();

//const {DATABASE_URL} = require('../config');
//const { BlogPost, User } = require('../models');
const { app, runServer, closeServer } = require('../server');
//console.log(app);
//const { TEST_DATABASE_URL } = require('../config');

chai.use(chaiHttp);


const numInCohort = 6;



// this function creates the tables in the database.
// we'll call it in an `beforeEach` block below
// to ensure that from one test to another
// we have clean tables to seed data into
// function createDb() {
//   return new Promise((resolve, reject) => {
//     console.warn('Creating database');
//     knex.raw(`CREATE TABLE cohort_members(id serial PRIMARY KEY, first_name TEXT NOT NULL, 
//             last_name TEXT NOT NULL,cohort_id int NOT NULL,location TEXT); 
//             CREATE TABLE pairings(id serial PRIMARY KEY, id1 integer NOT NULL, 
//             name1 text NOT NULL, id2 integer,name2 text, cycles_id integer, rating integer,
//             rating_comment text, comment text); CREATE TABLE set_of_pairs(id serial PRIMARY KEY,
//             pair1 integer, pair2 integer, pair3 integer, cycles_id integer, expected_rating NUMERIC(4, 2),
//             actual_rating integer,frozen bool default 'false', current bool default 'false', comment text);
//       `)
//       .then(result => resolve(result))
//       .catch(err => reject(err));
//   });
// }


// this function deletes the entire database.
// we'll call it in an `afterEach` block below
// to ensure  that data from one test does not stick
// around for next one
// function tearDownDb() {
//   return new Promise((resolve, reject) => {
//     console.warn('Deleting database');
//     knex.raw(`DROP TABLE IF EXISTS set_of_pairs; 
//             DROP TABLE IF EXISTS pairings; DROP TABLE IF EXISTS cohort_members;`)
//       .then(result => resolve(result))
//       .catch(err => reject(err));
//   });
// }

// this function deletes all that data in the database.
// we'll call it in an `afterEach` block below
// to ensure  that data from one test does not stick
// around for next one
function clearTablesDb() {
  return new Promise((resolve, reject) => {
    console.warn('Deleting all data');
    knex.raw(`DELETE FROM set_of_pairs; 
            DELETE FROM pairings; DELETE FROM cohort_members;
            ALTER SEQUENCE set_of_pairs_id_seq RESTART WITH 1;
            ALTER SEQUENCE pairings_id_seq RESTART WITH 1;
            ALTER SEQUENCE cohort_members_id_seq RESTART WITH 1;
            `)
      .then(result => resolve(result))
      .catch(err => reject(err));
  });
}


// used to put randomish documents in db
// so we have data to work with and assert about.
// we use the Faker library to automatically
// generate placeholder values for author, title, content
// and then we insert that data into mongo
function seedPairsData() {
  return new Promise((resolve, reject) => {
    console.warn('Seeding data in the database');
    knex.raw(`insert into cohort_members (first_name, last_name, cohort_id, location) 
            values ('Cersei', 'Lannister', 1, 'Kings Landing'); 
            insert into cohort_members (first_name, last_name, cohort_id, location) 
            values ('Jon', 'Snow', 1, 'Winterfell');
            insert into cohort_members (first_name, last_name, cohort_id, location) 
            values ('Sansa', 'Stark', 1, 'Winterfell');
            insert into cohort_members (first_name, last_name, cohort_id, location) 
            values ('Tyrion', 'Lannister', 1, 'Meereen');
            insert into cohort_members (first_name, last_name, cohort_id, location) 
            values ('Daenerys', 'Targaryen', 1, 'Meereen');
            insert into cohort_members (first_name, last_name, cohort_id, location) 
            values ('Petyr', 'Baelish', 1, 'Meereen');
            insert into pairings (id1, id2, cycles_id, rating, rating_comment, name1, name2) 
            values (4, 5, 1, 3, 'no comments','Daenerys','Petyr');
            insert into pairings (id1, id2, cycles_id, rating, rating_comment, name1, name2) 
            values (2, 1, 1, 4, 'she needs him', 'Sansa', 'Jon');
            insert into pairings (id1, id2, cycles_id, rating, rating_comment, name1, name2) 
            values (0, 3, 1, 1, 'will kill eachother given the opportunity', 'Cersei', 'Tyrion');
            insert into set_of_pairs(pair1, pair2, pair3, cycles_id, 
            expected_rating, current) values (1, 2, 3, 1, 2, 'true');`)
      .then(result => resolve(result))
      .catch(err => reject(err));
  });
}




describe('blog posts API resource with user authentication', function () {

  before(function () {
    return runServer(TEST_DATABASE, PORT);
  });

  beforeEach(function () {
    return seedPairsData();
  });

  afterEach(function () {
    // tear down database so we ensure no state from this test
    // effects any coming after.
    return clearTablesDb();
  });

  after(function () {
    return closeServer();
  });

  // note the use of nested `describe` blocks.
  // this allows us to make clearer, more discrete tests that focus
  // on proving something small
  describe('GET endpoint', function () {

    it('should return all existing cohort members', function () {
      // strategy:
      //    1. get back all posts returned by by GET request to `/posts`
      //    2. prove res has right status, data type
      //    3. prove the number of posts we got back is equal to number
      //       in db.
      let res;
      return chai.request(app)
        .get('/cohort_members')
        .then(_res => {
          res = _res;
          //console.log(res);
          res.should.have.status(200);
          // otherwise our db seeding didn't work
          res.body.should.have.length.of.at.least(1);

          return numInCohort;
        })
        .then(count => {
          // the number of returned posts should be same
          // as number of posts in DB
          res.body.should.have.length(count);
        });
    });

    it('should return active cohort members with right fields', function () {
      // Strategy: Get back all active cohort members, and ensure they have expected keys

      let resCM;
      return chai.request(app)
        .get('/cohort_members/active')
        .then(function (res) {

          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length.of.at.least(1);

          res.body.forEach(function (cm) {
            cm.should.be.a('object');
            cm.should.include.keys('id','first_name', 'last_name', 'cohort_id', 'location', 'active');
          });
          // just check one of the posts that its values match with those in db
          // and we'll assume it's true for rest
          resCM = res.body[0];
          return knex('cohort_members').where('id', resCM.id).then(results => results);
        })
        .then( cm => {
          resCM.id.should.equal(cm[0].id);
          resCM.first_name.should.equal(cm[0].first_name);
          resCM.last_name.should.equal(cm[0].last_name);
          resCM.cohort_id.should.equal(cm[0].cohort_id);
          resCM.location.should.equal(cm[0].location);
          resCM.active.should.equal(cm[0].active);
        });
    });
  });

//insert into cohort_members (first_name, last_name, cohort_id, location) 
//values ('Petyr', 'Baelish', 1, 'Meereen');

  describe('POST endpoint', function () {
    // strategy: make a POST request with data,
    // then prove that the post we get back has
    // right keys, and that `id` is there (which means
    // the data was inserted into db)
    //const fakeFName = faker.name.firstName();
    //const fakeLName = faker.name.lastName();

    const newCM = {
      first_name: 'Bran', 
      last_name:'Stark',
      cohort_id: 1,
      location: 'unknown'
    };

    it('should add a new blog post', function () {

      let user;
      return chai.request(app)
        .post('/cohort_members')
        .send(newCM)
        .then(function (res) {
          //console.log(res.body[0]);
          res.should.have.status(200);
          res.should.be.json;
          res.body[0].should.be.a('object');
          res.body[0].should.include.keys(
            'id', 'first_name', 'last_name', 'cohort_id', 'location');
          res.body[0].location.should.equal(newCM.location);
          // cause Mongo should have created id on insertion
          res.body[0].id.should.not.be.null;
          res.body[0].first_name.should.equal(newCM.first_name);
          res.body[0].last_name.should.equal(newCM.last_name);
          return knex('cohort_members').where('id', res.body[0].id).then(result => result);
        })
        .then(cm => {
          //console.log(cm);
          cm[0].first_name.should.equal(newCM.first_name);
          cm[0].last_name.should.equal(newCM.last_name);
          cm[0].cohort_id.should.equal(newCM.cohort_id);
          cm[0].location.should.equal(newCM.location);
        });
    });
  });


//   describe('PUT endpoint', function () {

//     // strategy:
//     //  1. Get an existing post from db
//     //  2. Make a PUT request to update that post
//     //  3. Prove post returned by request contains data we sent
//     //  4. Prove post in db is correctly updated
//     const fakeFName = faker.name.firstName();
//     const fakeLName = faker.name.lastName();

//     it('should update fields you send over', function () {
//       const updateData = {
//         title: 'cats cats cats',
//         content: 'dogs dogs dogs',
//         author: {
//           firstName: 'foo',
//           lastName: 'bar'
//         }
//       };
//       let user;

//       return User.create({
//         username: faker.internet.userName(),
//         // Substitute the hash you generated here
//         password: '$2a$10$JW/va21Tev0oCSaQVHTPh.R6fsioI8QlL5MndlEuRPneeYy1GfHVe',
//         firstName: fakeFName,
//         lastName: fakeLName
//       })
//         .then(_user => user = _user)
//         .then(() => {
//           return BlogPost
//             .findOne()
//             .exec()
//             .then(post => {
//               updateData.id = post.id;

//               return chai.request(app)
//                 .put(`/posts/${post.id}`)
//                 .auth(user.username, 'test-password')
//                 .send(updateData);
//             });
//         })
//         .then(res => {
//           res.should.have.status(201);
//           res.should.be.json;
//           res.body.should.be.a('object');
//           res.body.title.should.equal(updateData.title);
//           res.body.author.should.equal(
//             `${updateData.author.firstName} ${updateData.author.lastName}`);
//           res.body.content.should.equal(updateData.content);

//           return BlogPost.findById(res.body.id).exec();
//         })
//         .then(post => {
//           post.title.should.equal(updateData.title);
//           post.content.should.equal(updateData.content);
//           post.author.firstName.should.equal(updateData.author.firstName);
//           post.author.lastName.should.equal(updateData.author.lastName);
//         });
//     });
//   });


//   describe('PUT endpoint', function () {

//     // strategy:
//     //  1. Get an existing post from db
//     //  2. Make a PUT request to update that post
//     //  3. Prove post returned by request contains data we sent
//     //  4. Prove post in db is correctly updated
//     const fakeFName = faker.name.firstName();
//     const fakeLName = faker.name.lastName();

//     it('should not update fields you send over with improper credentials', function () {
//       const updateData = {
//         title: 'cats cats cats',
//         content: 'dogs dogs dogs',
//         author: {
//           firstName: 'foo',
//           lastName: 'bar'
//         }
//       };
//       let user;

//       return User.create({
//         username: faker.internet.userName(),
//         // Substitute the hash you generated here
//         password: '$2a$10$JW/va21Tev0oCSaQVHTPh.R6fsioI8QlL5MndlEuRPneeYy1GfHVe',
//         firstName: fakeFName,
//         lastName: fakeLName
//       })
//         .then(_user => user = _user)
//         .then(() => {
//           return BlogPost
//             .findOne()
//             .exec()
//             .then(post => {
//               updateData.id = post.id;

//               return chai.request(app)
//                 .put(`/posts/${post.id}`)
//                 .auth(faker.internet.userName(), faker.internet.password())
//                 .send(updateData);
//             });
//         })
//         .then(res => {
//           res.should.not.have.status(201);
//           res.should.not.be.json;
//           res.body.should.not.be.a('object');
//           res.body.title.should.not.equal(updateData.title);
//           res.body.author.should.not.equal(
//             `${updateData.author.firstName} ${updateData.author.lastName}`);
//           res.body.content.should.not.equal(updateData.content);

//         })
//         .catch(function(err) {
//           err.should.be.an('error');
//         });
//     });
//   });



  describe('DELETE endpoint', function () {
    // strategy:
    //  1. get a cohort member
    //  2. make a DELETE request for that cohort member's id
    //  3. assert that response has right status code
    //  4. prove that cohort member with the id is inactive in the db
    
    const newCM = {
      first_name: 'Bran', 
      last_name:'Stark',
      cohort_id: 1,
      location: 'unknown'
    };

    it('should delete a cohort member by id', function () {

      let cm;

      return knex('cohort_members').insert(newCM)
        .returning(['id','first_name', 'last_name', 'cohort_id', 'location'])
        .then(result => result)
        .then(_cm => cm = _cm)
        .then(() => {
          return chai.request(app).delete(`/cohort_members/${cm[0].id}`).then(result => result);
        })
        .then(res => {
          res.should.have.status(200);
          return knex('cohort_members').where('id', cm[0].id).then(res1 => res1);
        })
        .then(cm1 => {
          //console.log(_cm);
          // when a variable's value is null, chaining `should`
          // doesn't work. so `_post.should.be.null` would raise
          // an error. `should.be.null(_post)` is how we can
          // make assertions about a null value.
          cm1[0].id.should.equal(cm[0].id);
          cm1[0].active.should.equal(false);
        });
    });

  });

});
