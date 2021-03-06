const express = require('express')
const Model = require('../mongodb/db')
const router = express.Router()
const chalk = require('chalk')
const moment = require('moment')
const mongoose = require('mongoose')
const config = require('../utils/config')
const shortid = require('shortid');
const WebSocket = require('ws');
const ObjectId = mongoose.Types.ObjectId

var wss = require('../utils/ws.js')

const error = chalk.bold.red
const success = chalk.bold.green

const connection = config.connection

//发表文章
const post = (req, res, next) => {
	let time = moment().format('YYYY-MM-DD HH:mm')
	// let time = {
	// 	date: moment(date).format(),
	// 	year: moment(date).format('YYYY'),
	// 	month: moment(date).format('YYYY-MM'),
	// 	day: moment(date).format('YYYY-MM-DD'),
	// 	minute: moment(date).format('YYYY-MM-DD HH:mm')
	// }
	let post = new Model.Post({
		author: req.body.author,
		title: req.body.title,
		content: req.body.content,
		time: time,
		comments: [],
		tags: req.body.tags
	})

	post.save(err => {
		if(err) return next(err)
		console.log(success('文章' + post.title + '发表成功'))
		res.json({
			message: '文章发表成功',
			code: 1
		})
	})
}

//三种传参方式获取文章 user用户名/tag标签/id文章id/没有查询参数获取全部文章
const getPosts = (req, res, next) => {
	if(req.query.id) {
		Model.Post.findById(req.query.id, (err, docs) => {
			if(err) return next(err)
			res.json(docs)
			Model.Post.updateOne({ _id: ObjectId(req.query.id) }, { $inc: { "pv": 1 } }, err => {
				if(err) return next(err)
			})
		})
	}else if(req.query.user){
		Model.Post.find({ author: req.query.user }).sort({ _id: -1 }).exec((err, docs) => {
			if(err) return next(err)
			res.json(docs)
		})
	} else if(req.query.tag) {
		Model.Post.find({ tags: req.query.tag }).sort({ _id: -1 }).exec((err, docs) => {
			if(err) return next(err)
			res.json(docs)
		})
	} else if(JSON.stringify(req.query) == '{}') {
		Model.Post.find().sort({ _id: -1 }).exec((err, docs) => {
			if(err) return next(err)
			res.json(docs)		
		})		
	} else {
		return next()
	}
}

//修改文章
const edit = (req, res, next) => {
	Model.Post.update({ _id: ObjectId(req.body.id) },
		{
			title: req.body.title,
			content: req.body.content,
			tags: req.body.tags
		}, (err) => {
		  if(err) {
		  	res.send(new Number(0))
		  	return next(err)
		  } else {
		  	res.send(new Number(1))
		  }
		})
}

//删除文章
const del = (req, res, next) => {
	Model.Post.remove({ _id: ObjectId(req.body.id) }, (err) => {
		if(err){
			res.send(new Number(0))
			return next(err)
		} else {
			res.send(new Number(1))
		}
	})
}

//存储评论
const addComment = (req, res, next) => {
	let cid = shortid.generate()
	var comment = {
		id: cid,
		name: req.body.name,
		text: req.body.text,
		time: moment().format('YYYY-MM-DD HH:mm')
	}
	Model.Post.update({ _id: ObjectId(req.body.id) },
		{ $push: { comments: comment } }, (err) => {
			if(err) {
				res.send(new Number(0))
				return next(err)
			} else {
				
				//根据请求参数中的 author(被评论文章的用户名) 进行消息推送
				Model.User.findOne({ name: req.body.author }, (err, docs) => {
					if(err) console.log(err) 
				  let notice = {
				  	stype: 'comment',
				  	pid: req.body.id,
				  	cid: cid
				  }					
					if(docs.online) { //如果用户在线直接通过ws转发消息到被评论人
			    	if(!!connection[req.body.author]) {
			    		connection[req.body.author].send(JSON.stringify(Object.assign(notice, { username: req.body.author})))
			    	}
					} else { //如果用户不在线 先存储新消息 后等待被评论人上线后推送
						console.log(config.offlineNotice)
						if(!config.offlineNotice[req.body.author]) 
							config.offlineNotice[req.body.author] = []
						config.offlineNotice[req.body.author].push(Object.assign(notice, { username: req.body.author}))
					}
					Model.User.update({ name: req.body.author }, 
						{ $push: { notice: notice } }, (err) => {
							if(err) console.log(err) 
							console.log('消息数据已添加')
					})
				})

				res.send(new Number(1))
			}
		})
}

//获取所有标签
const getAllTags = (req, res, next) => {
	Model.Post.find({}, (err, docs) => {
		if(err) return next(err)
		let tags = []
		docs.map(e => {
			e.tags.map(tag => {
				if(tags.indexOf(tag) == -1) {
					tags.push(tag)
				}	
			})
		})
		res.json(tags)
	})
}


router.post('/posts/post', post)
router.get('/posts', getPosts)
router.post('/posts/edit', edit)
router.post('/posts/del', del)
router.post('/posts/comment', addComment)
router.get('/posts/tags', getAllTags)


module.exports = router


// { 
//     "n": 1,
//     "nModified": 1,
//     "ok": 1
// }