const express = require('express');
const router = express.Router();
const knex = require('../db/knex');

router.get('/', function (req, res, next) {
  const isAuth = req.isAuthenticated();
  const showGrouped = req.query.grouped === '1'; // ?grouped=1 でグループ表示

  let myTasksPromise = Promise.resolve([]);
  if (isAuth) {
    const userId = req.user.id;
    myTasksPromise = knex("tasks")
      .join("users", "tasks.user_id", "users.id")
      .select("tasks.*", "users.name")
      .where({ "tasks.user_id": userId })
      .orderBy("tasks.created_at", "desc"); // 追加: 新しい順
  }

  const allTasksPromise = knex("tasks")
    .join("users", "tasks.user_id", "users.id")
    .select("tasks.*", "users.name")
    .orderBy("tasks.created_at", "desc");

  Promise.all([myTasksPromise, allTasksPromise])
    .then(function ([myTasks, allTasks]) {
      let groupedTodos = {};
      if (showGrouped) {
        allTasks.forEach(todo => {
          if (!groupedTodos[todo.name]) groupedTodos[todo.name] = [];
          groupedTodos[todo.name].push(todo);
        });
      }
      res.render('index', {
        title: 'Practice',
        isAuth: isAuth,
        todos: myTasks,
        groupedTodos: showGrouped ? groupedTodos : null,
        allTodos: showGrouped ? null : allTasks,
        showGrouped: showGrouped,
      });
    })
    .catch(function (err) {
      console.error(err);
      res.render('index', {
        title: 'Practice',
        isAuth: isAuth,
        todos: [],
        groupedTodos: {},
        allTodos: [],
        showGrouped: showGrouped,
        errorMessage: [err.sqlMessage],
      });
    });
});



router.post('/', function (req, res, next) {
  const isAuth = req.isAuthenticated();
  const userId = req.user.id;
  const todo = req.body.add;
  const duration = req.body.duration; // 追加
  knex("tasks")
    .insert({user_id: userId, content: todo, duration: duration})
    .then(function () {
      res.redirect('/')
    })
    .catch(function (err) {
      console.error(err);
      res.render('index', {
        title: 'Practice',
        isAuth: isAuth,
        todos: [],
        groupedTodos: {},
        errorMessage: [err.sqlMessage],
      });
    });
});

router.use('/signup', require('./signup'));
router.use('/signin', require('./signin'));
router.use('/logout', require('./logout'));

module.exports = router;