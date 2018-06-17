var express = require("express");
var bodyParser = require("body-parser");
var path = require("path");
var mongoose = require("mongoose");

const request = require("request");
const cheerio = require("cheerio");

var db = require("../models");

var app = express();

module.exports = function (app) {
  app.get("/articles", function (req, res) {
    db.Article.find({})
      .then(function (dbArticles) {
        res.json(dbArticles);
      })
      .catch(function (err) {
        return res.json(err);
      })
  });

  app.put("/save", function (req, res) {
    db.Article.updateOne({ _id: req.body.id }, { $set: { saved: true } })
      .then((updatedArticles) => {
        res.json(updatedArticles);
      })
      .catch(function (err) {
        return res.json(err);
      })
  })

  app.put("/unsave", function (req, res) {
    db.Article.updateOne({ _id: req.body.id }, { $set: { saved: false } })
      .then((updatedArticles) => {
        res.json(updatedArticles);
      })
      .catch(function (err) {
        return res.json(err);
      })
  })

  app.post("/articles/:id", function (req, res) {
    db.Comment.create(req.body)
    .then(function (newComment) {
      console.log(newComment);
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { comment: newComment._id }, { new: true });

    })
    .then(function (addedComment) {
      res.redirect("/");
    })
    .catch(function (err) {
      return res.json(err);
    });
  })

  app.get("/scrape", function (req, res) {


    request("http://www.nytimes.com/", function (error, response, html) {

      var $ = cheerio.load(html);
      $("a.js-event-tracking").each(function (i, element) {

        let result = {};

        result.link = "http://www.nytimes.com" + $(element).attr("href");
        result.title = $(element).data('event-title')
        result.summary = $(element).children("div").children('p').text();



        // Save & push results into previously defined array
        if (result.title) {
          db.Article.create(result)
            .then(function (newArticle) {
              console.log(newArticle)
            })
            .catch(function (err) {
              console.error(err);
            })
        };
      });
    });
    res.redirect('/');
  });
}