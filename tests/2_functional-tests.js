// tests/2_functional-tests.js
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const Stock = require('../models/Stock');

const { assert } = chai;
chai.use(chaiHttp);

suite('Functional Tests', function () {
  this.timeout(8000);

  suiteSetup(async function () {
    try { await Stock.deleteMany({}); } catch (e) { /* ignore */ }
  });

  // 1) Visualización de un stock
  test('Visualización de un stock: GET /api/stock-prices', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.property(res.body.stockData, 'stock');
        assert.property(res.body.stockData, 'price');
        assert.property(res.body.stockData, 'likes');
        assert.equal(res.body.stockData.stock, 'GOOG');
        assert.isNumber(res.body.stockData.price);
        assert.isNumber(res.body.stockData.likes);
        done();
      });
  });

  // 2) Ver un stock y darle me gusta
  test('Ver un stock y darle me gusta', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG', like: 'true' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body.stockData.stock, 'GOOG');
        assert.isAtLeast(res.body.stockData.likes, 1);
        done();
      });
  });

  // 3) Ver el mismo stock y volver a gustarle (no duplica por IP)
  test('Ver el mismo stock y volver a gustarle (misma IP no duplica)', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG' })
      .end((err, first) => {
        const likesBefore = first.body.stockData.likes;

        chai.request(server)
          .get('/api/stock-prices')
          .query({ stock: 'GOOG', like: 'true' })
          .end((err2, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.body.stockData.likes, likesBefore);
            done();
          });
      });
  });

  // 4) Visualización de dos acciones
  test('Visualización de dos acciones', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: ['GOOG', 'MSFT'] })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body.stockData);
        assert.lengthOf(res.body.stockData, 2);
        res.body.stockData.forEach((s) => {
          assert.property(s, 'stock');
          assert.property(s, 'price');
          assert.property(s, 'rel_likes');
          assert.isNumber(s.price);
        });
        done();
      });
  });

  // 5) Ver dos acciones y gustarles
  test('Ver dos acciones y gustarles', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: ['GOOG', 'MSFT'], like: 'true' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body.stockData);
        assert.lengthOf(res.body.stockData, 2);
        const [a, b] = res.body.stockData;
        assert.equal(a.rel_likes + b.rel_likes, 0);
        done();
      });
  });
});
