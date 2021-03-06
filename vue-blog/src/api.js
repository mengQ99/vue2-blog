import axios from 'axios'
import store from './store'
import * as types from './store/types'
import config from '@/assets/config'

axios.defaults.baseURL = config.baseURL
axios.defaults.headers.post['Content-Type'] = 'application/json'
axios.defaults.timeout = 5000
// axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'


//http request 拦截器
axios.interceptors.request.use(request => {
	if(store.state.token){
		//判断是否存在token 如果存在每个http header都加上token
		request.headers.Authorization = `token ${store.state.token}`
	}
	return request 
}, err => {
	return Promise.reject(err)
})

//http response 拦截器
axios.interceptors.response.use((response) => {
	return response
}, (err) => {
	if(err.response){
		switch(err.response.status){
			case 401:
				//如果返回 401 清除token信息 跳转到首页给出提示信息
        store.commit(types.LOGOUT)
        window.vm.$router.push('/')
        window.vm.$message('TOKEN过期请重新登录')
		}
	}
	return Promise.reject(err.response.data)
})

export default {
  register(data) {
    return axios.post('/register', data)
  },
  login(data) {
    return axios.post('/login', data)
  },
  logout(name) {
    return axios.get('/logout', { params: { name } })
  },
  post(data) { //发表文章
    return axios.post('/posts/post', data)
  },
  getAllPosts() { //获得全部文章
    return axios.get('/posts')
  },
  getPostsById(id) { //根据文章id获取文章
    return axios.get('/posts', { params: { id } })
  },
  getPostsByUser(user) { //根据用户名获取文章
    return axios.get('/posts', { params: { user } })
  },
  getPostsByTag(tag) { //根据标签获取文章
    return axios.get('/posts', { params: { tag } })
  },
  editPosts(data) { //标记文章
    return axios.post('/posts/edit', data)
  },
  delPosts(data) { //删除文章
    return axios.post('/posts/del', data)
  },
  addComment(data) { //添加文章评论
    return axios.post('/posts/comment', data)
  },
  getUsers() { //获得全部用户
    return axios.get('/users')
  },
  delUser(data) { //删除用户
    return axios.post('/delUser', data)
  },
  getUserInfo(name){ //getuserinfobyname
    return axios.get('/getUser', { params: { name } })
  },
  queryByCondition(data){ //综合条件查询
    return axios.post('/tool/query', data)
  },
  getAllTags(){ //获得全部标签
    return axios.get('/posts/tags')
  },
  getNoticeIsRead(id){ //消息已读
    return axios.get('/noticeIsRead', { params: { id } })
  }, 
  getYearPvStatistics(){ //pv统计趋势图
    return axios.get('/tool/getYearPvStatistics')
  },
  getTagsWordCloud(){ //tag字符云
    return axios.get('/tool/getTagsWordCloud')
  }

}