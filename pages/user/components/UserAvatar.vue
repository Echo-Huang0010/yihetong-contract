<template>
  <button
    class="img-avatar"
    type="defualt"
    :open-type="userInfo ? 'chooseAvatar' : ''"
    @chooseavatar="onChooseAvatar"
  >
    <image class="img-avatar" :src="userInfo && userInfo.avatarUrl ? userInfo.avatarUrl : '/static/ic_user_head.svg'" mode="aspectFill" />
  </button>
</template>

<script>
import { upload } from '@/api/oss.js';
import userInfoApi from '@/api/api';
import { mapState, mapActions } from 'vuex';
export default {
  computed: {
    ...mapState(['userInfo']),
  },
  methods: {
    ...mapActions(['uinfo']),
    onChooseAvatar(e) {
      const { avatarUrl } = e.detail;
      upload([
        {
          path: avatarUrl,
          size: 500,
        },
      ]).then(path => {
        if (path) {
          userInfoApi.changeAvatar(path[0].url).then(() => {
            this.uinfo();
          });
        }
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.img-avatar {
  width: 160rpx;
  height: 160rpx;
  background: #ffffff;
  border-radius: 50%;
  overflow: hidden;
  padding: 0;
  
  image {
    width: 100%;
    height: 100%;
  }
}
</style>
