<template>
	<div>
		<view v-if="setting.telphone">电话：{{setting.telphone}}</view>
		<view v-if="setting.qq">QQ：{{setting.qq}}</view>
		<view v-if="setting.weixin">微信号：{{setting.weixin}}</view>
	</div>
</template>

<script>
	import setting from '@/config/setting.js';
	export default {
	  components: {},
	  data() {
	    return {
	      setting
	    };
	  },
	  onLoad() {},
	};
</script>

<style>
</style>

