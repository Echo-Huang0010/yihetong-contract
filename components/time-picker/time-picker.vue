<template>
  <view>
    <picker
      :disabled="disabled"
      mode="multiSelector"
      :range="dates"
      :value="value"
      @cancel="cancel"
      @change="confirm"
      @columnchange="scroll"
    >
      <slot></slot>
    </picker>
  </view>
</template>

<script>
export default {
  props: {
    showType: {
      type: String,
      default: 'dateToTime',
    },
    beginDate: {
      type: String,
      default: '1900-01-01',
    },
    beginTime: {
      type: String,
      default: '00:00:00',
    },
    endDate: {
      type: String,
      default: '2050-12-31',
    },
    endTime: {
      type: String,
      default: '23:59:59',
    },
    isClick: {
      type: Boolean,
      default: false,
    },
    index1: {
      type: Number,
      default: 0,
    },
    index2: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      dates: [],
      years: [],
      year: 2020,
      valueYear: 0,
      beginYear: 1900,
      endYear: 2050,
      months: [],
      month: 1,
      valueMonth: 0,
      beginMonth: 1,
      endMonth: 12,
      days: [],
      day: 1,
      beginDay: 1,
      endDay: 31,
      hours: [],
      hour: 0,
      beginHour: 0,
      endHour: 23,
      minutes: [],
      minute: 0,
      beginMinute: 0,
      endMinute: 59,
      seconds: [],
      second: 0,
      beginSecond: 0,
      endSecond: 59,
      value: [],
      showMode: this.showType,
      disabled: this.isClick,
      index11: this.index1,
      index22: this.index2,
      pams: ['上午', '下午'],
      pam: 0,
    };
  },
  watch: {
    showType(oldValue, newValue) {
      // console.log('showType传入数值变化：', oldValue + '->' + newValue);
      this.showMode = newValue;
    },
    isClick(oldValue, newValue) {
      // console.log('isClick传入数值变化：', oldValue + '->' + newValue);
      this.disabled = newValue;
    },
  },
  created() {
    // console.log('========传参数==========',this.beginDate)
    // if (this.getMillisecond(this.beginDate) > this.getMillisecond(this.endDate)) {
    //   let date = this.beginDate;
    //   this.beginDate = this.endDate;
    //   this.endDate = date;
    // }
    // if (
    //   this.getMillisecond('2020-01-01 ' + this.beginTime) >
    //   this.getMillisecond('2020-01-01 ' + this.endTime)
    // ) {
    //   let time = this.beginTime;
    //   this.beginTime = this.endTime;
    //   this.endTime = time;
    // }
    // 日期
    let beginDateList = this.beginDate.split('-');
    this.beginYear = beginDateList[0];
    this.beginMonth =
      beginDateList[1].charAt(0) == '0' ? beginDateList[1].charAt(1) : beginDateList[1];
    this.beginDay =
      beginDateList[2].charAt(0) == '0' ? beginDateList[2].charAt(1) : beginDateList[2];
    let endDateList = this.endDate.split('-');
    this.endYear = endDateList[0];
    this.endMonth = endDateList[1].charAt(0) == '0' ? endDateList[1].charAt(1) : endDateList[1];
    this.endDay = endDateList[2].charAt(0) == '0' ? endDateList[2].charAt(1) : endDateList[2];
    // 时间
    let beginTimeList = this.beginTime.split(':');
    this.beginHour =
      beginTimeList[0].charAt(0) == '0' ? beginTimeList[0].charAt(1) : beginTimeList[0];
    this.beginMinute =
      beginTimeList[1].charAt(0) == '0' ? beginTimeList[1].charAt(1) : beginTimeList[1];
    this.beginSecond =
      beginTimeList[2].charAt(0) == '0' ? beginTimeList[2].charAt(1) : beginTimeList[2];
    let endTimeList = this.endTime.split(':');
    this.endHour = endTimeList[0].charAt(0) == '0' ? endTimeList[0].charAt(1) : endTimeList[0];
    this.endMinute = endTimeList[1].charAt(0) == '0' ? endTimeList[1].charAt(1) : endTimeList[1];
    this.endSecond = endTimeList[2].charAt(0) == '0' ? endTimeList[2].charAt(1) : endTimeList[2];
    this.getDate();
    for (var i = parseInt(this.beginYear); i <= parseInt(this.endYear); i++) {
      this.years.push(i + '年');
    }
    this.getMonths();
    this.getDays();
    for (var j = parseInt(this.beginHour); j <= parseInt(this.endHour); j++) {
      this.hours.push(j + '时');
    }
    if (this.beginHour == this.endHour) {
      if (parseInt(this.beginMinute) > parseInt(this.endMinute)) {
        for (var l = parseInt(this.endMinute); l <= parseInt(this.beginMinute); l++) {
          this.minutes.push(l + '分');
        }
      } else {
        for (var m = parseInt(this.beginMinute); m <= parseInt(this.endMinute); m++) {
          this.minutes.push(m + '分');
        }
      }
    } else {
      for (var n = parseInt(this.beginMinute); n <= 59; n++) {
        this.minutes.push(n + '分');
      }
    }
    if (this.beginMinute == this.endMinute) {
      if (parseInt(this.beginSecond) > parseInt(this.endSecond)) {
        for (var o = parseInt(this.endSecond); o <= parseInt(this.beginSecond); o++) {
          this.seconds.push(o + '秒');
        }
      } else {
        for (var p = parseInt(this.beginSecond); p <= parseInt(this.endSecond); p++) {
          this.seconds.push(p + '秒');
        }
      }
    } else {
      for (var q = parseInt(this.beginSecond); q <= 59; q++) {
        this.seconds.push(q + '秒');
      }
    }
    this.getData();
    this.valueYear = this.beginYear;
    this.valueMonth = this.beginMonth;
  },
  methods: {
    scroll(e) {
      console.log('每一列滑动监听:', e);
      let column = e.detail.column;
      let value = e.detail.value;
      switch (this.showMode) {
        case 'time':
          {
            if (column == 0) {
              this.minutes = [];
              if (this.hours.length == 1) {
                if (parseInt(this.beginMinute) > parseInt(this.endMinute)) {
                  for (
                    var i21 = parseInt(this.endMinute);
                    i21 <= parseInt(this.beginMinute);
                    i21++
                  ) {
                    this.minutes.push(i21 + '分');
                  }
                } else {
                  for (
                    var i22 = parseInt(this.beginMinute);
                    i22 <= parseInt(this.endMinute);
                    i22++
                  ) {
                    this.minutes.push(i22 + '分');
                  }
                }
              } else {
                if (value == 0) {
                  for (var i23 = parseInt(this.beginMinute); i23 <= 59; i23++) {
                    this.minutes.push(i23 + '分');
                  }
                } else if (value == this.hours.length - 1) {
                  for (var i24 = 0; i24 <= parseInt(this.endMinute); i24++) {
                    this.minutes.push(i24 + '分');
                  }
                } else {
                  for (var i25 = 0; i25 <= 59; i25++) {
                    this.minutes.push(i25 + '分');
                  }
                }
              }
              this.dates[1] = this.minutes;
            } else if (column == 1) {
              this.seconds = [];
              if (this.minutes.length == 1) {
                if (parseInt(this.beginSecond) > parseInt(this.endSecond)) {
                  for (
                    var i26 = parseInt(this.endSecond);
                    i26 <= parseInt(this.beginSecond);
                    i26++
                  ) {
                    this.seconds.push(i26 + '秒');
                  }
                } else {
                  for (
                    var i27 = parseInt(this.beginSecond);
                    i27 <= parseInt(this.endSecond);
                    i27++
                  ) {
                    this.seconds.push(i27 + '秒');
                  }
                }
              } else {
                if (value == 0) {
                  for (var i28 = parseInt(this.beginSecond); i28 <= 59; i28++) {
                    this.seconds.push(i28 + '秒');
                  }
                } else if (value == this.minutes.length - 1) {
                  for (var i29 = 0; i29 <= parseInt(this.endSecond); i29++) {
                    this.seconds.push(i29 + '秒');
                  }
                } else {
                  for (var i30 = 0; i30 <= 59; i30++) {
                    this.seconds.push(i30 + '秒');
                  }
                }
                this.dates[2] = this.seconds;
              }
            }
          }
          break;

        case 'monthToDay':
          {
            this.getMonths();
            if (column == 0) {
              this.month = this.months[value].substring(0, this.months[value].length - 1);
              this.getDays();
            }

            this.dates[0] = this.months;
            this.dates[1] = this.days;
          }
          break;
        case 'yearToMonth':
          {
            if (column == 0) {
              this.year = this.years[value].substring(0, 4);
              if (value == 0) {
                this.month = this.beginMonth;
              }
            }
            this.getMonths();
            if (column == 1) {
              this.month = this.months[value].substring(0, this.months[value].length - 1);
            }
            this.dates[1] = this.months;
          }
          break;

        case 'dateToTime':
          {
            if (column == 4) {
              this.seconds = [];
              if (this.minutes.length == 1) {
                if (parseInt(this.beginSecond) > parseInt(this.endSecond)) {
                  for (
                    var i31 = parseInt(this.endSecond);
                    i31 <= parseInt(this.beginSecond);
                    i31++
                  ) {
                    this.seconds.push(i31 + '秒');
                  }
                } else {
                  for (
                    var i32 = parseInt(this.beginSecond);
                    i32 <= parseInt(this.endSecond);
                    i32++
                  ) {
                    this.seconds.push(i32 + '秒');
                  }
                }
              } else {
                if (value == 0) {
                  for (var i33 = parseInt(this.beginSecond); i33 <= 59; i33++) {
                    this.seconds.push(i33 + '秒');
                  }
                } else if (value == this.minutes.length - 1) {
                  for (var i34 = 0; i34 <= parseInt(this.endSecond); i34++) {
                    this.seconds.push(i34 + '秒');
                  }
                } else {
                  for (var i35 = 0; i35 <= 59; i35++) {
                    this.seconds.push(i35 + '秒');
                  }
                }
              }
            }
            this.dates[5] = this.seconds;
          }
          break;
        case 'monthToMinute':
          {
            this.getMonths();
            if (column == 0) {
              this.month = this.months[value].substring(0, this.months[value].length - 1);
              this.getDays();
            }
            this.dates[0] = this.months;
            this.dates[1] = this.days;
          }
          break;
        case 'yearToMinute':
          {
            if (column === 0) {
              this.months = [];
              this.getMonths();
              this.dates[1] = this.months;
              this.valueYear = this.dates[0][value].replace('年', '');
              if (this.beginYear && value > 0 && this.dates[1].length < 12) {
                for (var i36 = parseInt(this.beginMonth) - 1; i36 > 0; i36--) {
                  this.dates[1].unshift(i36 + '月');
                }
              }
              if (this.valueYear == this.endYear) {
                this.dates[1] = this.dates[1].slice(0, this.endMonth);
              }

              const lastDate = parseInt(this.dates[2][this.dates[2].length - 1].replace('日', ''));
              this.days = [];
              this.getDays();
              this.dates[2] = this.days;
              if (this.beginDay && value > 0 && this.dates[2].length < lastDate) {
                for (var i37 = parseInt(this.beginDay) - 1; i37 > 0; i37--) {
                  this.dates[2].unshift(i37 + '日');
                }
              }
            } else if (column === 1) {
              const lastDate = parseInt(this.dates[2][this.dates[2].length - 1].replace('日', ''));
              this.days = [];
              this.getDays();
              this.dates[2] = this.days;
              this.valueMonth = this.dates[1][value].replace('月', '');

              if (
                (this.beginDay && value > 0 && this.dates[2].length < lastDate) ||
                (this.beginYear && parseInt(this.valueYear) > this.beginYear)
              ) {
                for (var i38 = parseInt(this.beginDay) - 1; i38 > 0; i38--) {
                  this.dates[2].unshift(i38 + '日');
                }
              }

              if (parseInt(this.valueMonth) === parseInt(this.endMonth)) {
                this.dates[2] = this.dates[2].slice(0, this.endDay);
              }
            } else if (column == 3) {
              this.minutes = [];
              if (this.hours.length == 1) {
                if (parseInt(this.beginMinute) > parseInt(this.endMinute)) {
                  for (
                    var i39 = parseInt(this.endMinute);
                    i39 <= parseInt(this.beginMinute);
                    i39++
                  ) {
                    this.minutes.push(i39 + '分');
                  }
                } else {
                  for (
                    var i40 = parseInt(this.beginMinute);
                    i40 <= parseInt(this.endMinute);
                    i40++
                  ) {
                    this.minutes.push(i40 + '分');
                  }
                }
              } else {
                if (value == 0) {
                  for (var i41 = parseInt(this.beginMinute); i41 <= 59; i41++) {
                    this.minutes.push(i41 + '分');
                  }
                } else if (value == this.hours.length - 1) {
                  for (var i42 = 0; i42 <= parseInt(this.endMinute); i42++) {
                    this.minutes.push(i42 + '分');
                  }
                } else {
                  for (var i43 = 0; i43 <= 59; i43++) {
                    this.minutes.push(i43 + '分');
                  }
                }
              }
            }
            this.dates[4] = this.minutes;
          }
          break;
        case 'date':
          {
            if (column == 0) {
              this.year = this.years[value].substring(0, 4);
              if (value == 0) {
                this.month = this.beginMonth;
              }
              if (value == this.years.length - 1) {
                this.month = this.endMonth;
              }
            }
            this.getMonths();
            if (column == 1) {
              this.month =
                this.months[value].length == 3
                  ? this.months[value].substring(0, 2)
                  : this.months[value].substring(0, 1);
            }
            this.getDays();
            this.dates[1] = this.months;
            this.dates[2] = this.days;
          }
          break;
      }
    },
    confirm(e) {
      // console.log('确定:', e);
      let value = e.detail.value;
      let date = '';
      switch (this.showMode) {
        case 'year':
          {
            date = {
              key: this.years[value[0]].substring(0, 4),
              value: this.years[value[0]],
              index: this.index11,
              indexf: this.index22,
            };
          }
          break;
        case 'month':
          {
            date = {
              key: this.months[value[0]].substring(0, this.months[value[0]].length - 1),
              value: this.months[value[0]],
              index: this.index11,
              indexf: this.index22,
            };
          }
          break;
        case 'day':
          {
            date = {
              key: this.days[value[0]].substring(0, this.days[value[0]].length - 1),
              value: this.days[value[0]],
              index: this.index11,
              indexf: this.index22,
            };
          }
          break;
        case 'hour':
          {
            date = {
              key: this.hours[value[0]].substring(0, this.hours[value[0]].length - 1),
              value: this.hours[value[0]],
              index: this.index11,
              indexf: this.index22,
            };
          }
          break;
        case 'minute':
          {
            date = {
              key: this.minutes[value[0]].substring(0, this.minutes[value[0]].length - 1),
              value: this.minutes[value[0]],
              index: this.index11,
              indexf: this.index22,
            };
          }
          break;
        case 'second':
          {
            date = {
              key: this.seconds[value[0]].substring(0, this.seconds[value[0]].length - 1),
              value: this.seconds[value[0]],
              index: this.index11,
              indexf: this.index22,
            };
          }
          break;
        case 'yearToMonth':
          {
            let month = this.months[value[1]].substring(0, this.months[value[1]].length - 1);
            date = {
              year: this.years[value[0]].substring(0, 4),
              month,
              key:
                this.years[value[0]].substring(0, 4) +
                '-' +
                (month.length == 1 ? '0' + month : month),
              value: this.years[value[0]] + this.months[value[1]],
              index: this.index11,
              indexf: this.index22,
            };
          }
          break;
        case 'monthToDay':
          {
            let month = this.months[value[0]].substring(0, this.months[value[0]].length - 1);
            let day = this.days[value[1]].substring(0, this.days[value[1]].length - 1);
            date = {
              month,
              day,
              key:
                (month.length == 1 ? '0' + month : month) +
                '-' +
                (day.length == 1 ? '0' + day : day),
              value: this.months[value[0]] + this.days[value[1]],
              index: this.index11,
              indexf: this.index22,
            };
          }
          break;
        case 'hourToMinute':
          {
            let hour = this.hours[value[0]].substring(0, this.hours[value[0]].length - 1);
            let minute = this.minutes[value[1]].substring(0, this.minutes[value[1]].length - 1);
            date = {
              hour,
              minute,
              key:
                (hour.length == 1 ? '0' + hour : hour) +
                ':' +
                (minute.length == 1 ? '0' + minute : minute),
              value: this.hours[value[0]] + this.minutes[value[1]],
              index: this.index11,
              indexf: this.index22,
            };
          }
          break;
        case 'minuteToSecond':
          {
            let minute = this.minutes[value[0]].substring(0, this.minutes[value[0]].length - 1);
            let second = this.seconds[value[1]].substring(0, this.seconds[value[1]].length - 1);
            date = {
              key:
                (minute.length == 1 ? '0' + minute : minute) +
                ':' +
                (second.length == 1 ? '0' + second : second),
              value: this.minutes[value[0]] + this.seconds[value[1]],
              index: this.index11,
              indexf: this.index22,
            };
          }
          break;
        case 'date':
          {
            let month = this.months[value[1]].substring(0, this.months[value[1]].length - 1);
            let day = this.days[value[2]].substring(0, this.days[value[2]].length - 1);
            date = {
              year: this.years[value[0]].substring(0, 4),
              month,
              day,
              key:
                this.years[value[0]].substring(0, 4) +
                '-' +
                (month.length == 1 ? '0' + month : month) +
                '-' +
                (day.length == 1 ? '0' + day : day),
              value: this.years[value[0]] + this.months[value[1]] + this.days[value[2]],
              index: this.index11,
              indexf: this.index22,
            };
          }
          break;
        case 'time':
          {
            let hour = this.hours[value[0]].substring(0, this.hours[value[0]].length - 1);
            let minute = this.minutes[value[1]].substring(0, this.minutes[value[1]].length - 1);
            let second = this.seconds[value[2]].substring(0, this.seconds[value[2]].length - 1);
            date = {
              hour,
              minute,
              second,
              key:
                (hour.length == 1 ? '0' + hour : hour) +
                ':' +
                (minute.length == 1 ? '0' + minute : minute) +
                ':' +
                (second.length == 1 ? '0' + second : second),
              value: this.hours[value[0]] + this.minutes[value[1]] + this.seconds[value[2]],
              index: this.index11,
              indexf: this.index22,
            };
          }
          break;
        case 'yearToMinute':
          {
            let month = this.months[value[1]].substring(0, this.months[value[1]].length - 1);
            let day = this.days[value[2]].substring(0, this.days[value[2]].length - 1);
            let hour = this.hours[value[3]].substring(0, this.hours[value[3]].length - 1);
            let minute = this.minutes[value[4]].substring(0, this.minutes[value[4]].length - 1);
            date = {
              year: this.years[value[0]].substring(0, 4),
              month,
              day,
              hour,
              minute,
              key:
                this.years[value[0]].substring(0, 4) +
                '-' +
                (month.length == 1 ? '0' + month : month) +
                '-' +
                (day.length == 1 ? '0' + day : day) +
                ' ' +
                (hour.length == 1 ? '0' + hour : hour) +
                ':' +
                (minute.length == 1 ? '0' + minute : minute),
              value:
                this.years[value[0]] +
                this.months[value[1]] +
                this.days[value[2]] +
                this.hours[value[3]] +
                this.minutes[value[4]],
              index: this.index11,
              indexf: this.index22,
            };
          }
          break;
        case 'monthToMinute':
          {
            let month = this.months[value[0]].substring(0, this.months[value[0]].length - 1);
            let day = this.days[value[1]].substring(0, this.days[value[1]].length - 1);
            let hour = this.hours[value[2]].substring(0, this.hours[value[2]].length - 1);
            let minute = this.minutes[value[3]].substring(0, this.minutes[value[3]].length - 1);
            date = {
              month,
              day,
              hour,
              minute,
              key:
                (month.length == 1 ? '0' + month : month) +
                '-' +
                (day.length == 1 ? '0' + day : day) +
                ' ' +
                (hour.length == 1 ? '0' + hour : hour) +
                ':' +
                (minute.length == 1 ? '0' + minute : minute),
              value:
                this.months[value[0]] +
                this.days[value[1]] +
                this.hours[value[2]] +
                this.minutes[value[3]],
              index: this.index11,
              indexf: this.index22,
            };
          }
          break;

        case 'yearToPA':
          {
            let month = this.months[value[1]].substring(0, this.months[value[1]].length - 1);
            let day = this.days[value[2]].substring(0, this.days[value[2]].length - 1);
            let pam = this.pams[value[3]];
            date = {
              year: this.years[value[0]].substring(0, 4),
              month,
              day,
              pam,
              key:
                this.years[value[0]].substring(0, 4) +
                '-' +
                (month.length == 1 ? '0' + month : month) +
                '-' +
                (day.length == 1 ? '0' + day : day) +
                ' ' +
                pam,
              value:
                this.years[value[0]] +
                this.months[value[1]] +
                this.days[value[2]] +
                this.pams[value[3]],
              index: this.index11,
              indexf: this.index22,
            };
          }
          break;
        case 'monthToPA':
          {
            let month = this.months[value[0]].substring(0, this.months[value[0]].length - 1);
            let day = this.days[value[1]].substring(0, this.days[value[1]].length - 1);
            let pam = this.pams[value[2]];
            date = {
              month,
              day,
              pam,
              key:
                (month.length == 1 ? '0' + month : month) +
                '-' +
                (day.length == 1 ? '0' + day : day) +
                ' ' +
                pam,
              value: this.months[value[0]] + this.days[value[1]] + this.pams[value[2]],
              index: this.index11,
              indexf: this.index22,
            };
          }
          break;

        default:
          {
            let month = this.months[value[1]].substring(0, this.months[value[1]].length - 1);
            let day = this.days[value[2]].substring(0, this.days[value[2]].length - 1);
            let hour = this.hours[value[3]].substring(0, this.hours[value[3]].length - 1);
            let minute = this.minutes[value[4]].substring(0, this.minutes[value[4]].length - 1);
            let second = this.seconds[value[5]].substring(0, this.seconds[value[5]].length - 1);
            date = {
              year: this.years[value[0]].substring(0, 4),
              month,
              day,
              hour,
              minute,
              second,
              key:
                this.years[value[0]].substring(0, 4) +
                '-' +
                (month.length == 1 ? '0' + month : month) +
                '-' +
                (day.length == 1 ? '0' + day : day) +
                ' ' +
                (hour.length == 1 ? '0' + hour : hour) +
                ':' +
                (minute.length == 1 ? '0' + minute : minute) +
                ':' +
                (second.length == 1 ? '0' + second : second),
              value:
                this.years[value[0]] +
                this.months[value[1]] +
                this.days[value[2]] +
                this.hours[value[3]] +
                this.minutes[value[4]] +
                this.seconds[value[5]],
              index: this.index11,
              indexf: this.index22,
            };
          }
          break;
      }
      this.$emit('btnConfirm', date);
    },
    cancel() {
      // console.log('取消:', e);
      this.$emit('btnCancel');
    },
    getMonths() {
      this.months = [];
      if (
        parseInt(this.beginYear) == parseInt(this.year) &&
        parseInt(this.endYear) == parseInt(this.year)
      ) {
        for (var i1 = parseInt(this.beginMonth); i1 <= parseInt(this.endMonth); i1++) {
          this.months.push(i1 + '月');
        }
      } else if (parseInt(this.beginYear) >= parseInt(this.year)) {
        for (var i2 = parseInt(this.beginMonth); i2 <= 12; i2++) {
          this.months.push(i2 + '月');
        }
      } else if (parseInt(this.endYear) <= parseInt(this.year)) {
        for (var i3 = 1; i3 <= parseInt(this.endMonth); i3++) {
          this.months.push(i3 + '月');
        }
      } else {
        for (var i4 = 1; i4 <= 12; i4++) {
          this.months.push(i4 + '月');
        }
      }
    },
    getDays() {
      this.days = [];
      switch (this.month) {
        case 1:
        case 3:
        case 5:
        case 7:
        case 8:
        case 10:
        case 12:
        case '1':
        case '3':
        case '5':
        case '7':
        case '8':
        case '10':
        case '12':
          {
            if (parseInt(this.beginDay) < 0 || parseInt(this.beginDay) > 31) {
              this.beginDay = 1;
            }
            if (parseInt(this.endDay) < 0 || parseInt(this.endDay) > 31) {
              this.endDay = 31;
            }
            if (
              parseInt(this.beginYear) == parseInt(this.year) &&
              parseInt(this.endYear) == parseInt(this.year) &&
              parseInt(this.beginMonth) == parseInt(this.month) &&
              parseInt(this.endMonth) == parseInt(this.month)
            ) {
              for (var i5 = parseInt(this.beginDay); i5 <= parseInt(this.endDay); i5++) {
                this.days.push(i5 + '日');
              }
            } else if (
              (parseInt(this.beginYear) == parseInt(this.year) &&
                parseInt(this.endYear) == parseInt(this.year) &&
                parseInt(this.beginMonth) == parseInt(this.month)) ||
              (parseInt(this.beginYear) >= parseInt(this.year) &&
                parseInt(this.beginMonth) == parseInt(this.month))
            ) {
              for (var i6 = parseInt(this.beginDay); i6 <= 31; i6++) {
                this.days.push(i6 + '日');
              }
            } else if (
              (parseInt(this.beginYear) == parseInt(this.year) &&
                parseInt(this.endYear) == parseInt(this.year) &&
                parseInt(this.endMonth) == parseInt(this.month)) ||
              (parseInt(this.endYear) <= parseInt(this.year) &&
                parseInt(this.endMonth) == parseInt(this.month))
            ) {
              for (var i7 = 1; i7 <= parseInt(this.endDay); i7++) {
                this.days.push(i7 + '日');
              }
            } else {
              for (var i8 = 1; i8 <= 31; i8++) {
                this.days.push(i8 + '日');
              }
            }
          }
          break;
        case 4:
        case 6:
        case 9:
        case 11:
        case '4':
        case '6':
        case '9':
        case '11':
          {
            if (parseInt(this.beginDay) < 0 || parseInt(this.beginDay) > 30) {
              this.beginDay = 1;
            }
            if (parseInt(this.endDay) < 0 || parseInt(this.endDay) > 30) {
              this.endDay = 30;
            }
            if (
              parseInt(this.beginYear) == parseInt(this.year) &&
              parseInt(this.endYear) == parseInt(this.year) &&
              parseInt(this.beginMonth) == parseInt(this.month) &&
              parseInt(this.endMonth) == parseInt(this.month)
            ) {
              for (var i9 = parseInt(this.beginDay); i9 <= parseInt(this.endDay); i9++) {
                this.days.push(i9 + '日');
              }
            } else if (
              (parseInt(this.beginYear) == parseInt(this.year) &&
                parseInt(this.endYear) == parseInt(this.year) &&
                parseInt(this.beginMonth) == parseInt(this.month)) ||
              (parseInt(this.beginYear) >= parseInt(this.year) &&
                parseInt(this.beginMonth) == parseInt(this.month))
            ) {
              for (var i10 = parseInt(this.beginDay); i10 <= 30; i10++) {
                this.days.push(i10 + '日');
              }
            } else if (
              (parseInt(this.beginYear) == parseInt(this.year) &&
                parseInt(this.endYear) == parseInt(this.year) &&
                parseInt(this.endMonth) == parseInt(this.month)) ||
              (parseInt(this.endYear) <= parseInt(this.year) &&
                parseInt(this.endMonth) == parseInt(this.month))
            ) {
              for (var i11 = 1; i11 <= parseInt(this.endDay); i11++) {
                this.days.push(i11 + '日');
              }
            } else {
              for (var i12 = 1; i12 <= 30; i12++) {
                this.days.push(i12 + '日');
              }
            }
          }
          break;
        case 2:
        case '2':
          {
            if (
              (parseInt(this.year) % 4 == 0 && parseInt(this.year) % 100 != 0) ||
              parseInt(this.year) % 400 == 0
            ) {
              if (parseInt(this.beginDay) < 0 || parseInt(this.beginDay) > 29) {
                this.beginDay = 1;
              }
              if (parseInt(this.endDay) < 0 || parseInt(this.endDay) > 29) {
                this.endDay = 29;
              }
              if (
                parseInt(this.beginYear) == parseInt(this.year) &&
                parseInt(this.endYear) == parseInt(this.year) &&
                parseInt(this.beginMonth) == parseInt(this.month) &&
                parseInt(this.endMonth) == parseInt(this.month)
              ) {
                for (var i13 = parseInt(this.beginDay); i13 <= parseInt(this.endDay); i13++) {
                  this.days.push(i13 + '日');
                }
              } else if (
                (parseInt(this.beginYear) == parseInt(this.year) &&
                  parseInt(this.endYear) == parseInt(this.year) &&
                  parseInt(this.beginMonth) == parseInt(this.month)) ||
                (parseInt(this.beginYear) >= parseInt(this.year) &&
                  parseInt(this.beginMonth) == parseInt(this.month))
              ) {
                for (var i14 = parseInt(this.beginDay); i14 <= 29; i14++) {
                  this.days.push(i14 + '日');
                }
              } else if (
                (parseInt(this.beginYea) == parseInt(this.year) &&
                  parseInt(this.endYear) == parseInt(this.year) &&
                  parseInt(this.endMonth) == parseInt(this.month)) ||
                (parseInt(this.endYear) <= parseInt(this.year) &&
                  parseInt(this.endMonth) == parseInt(this.month))
              ) {
                for (var i15 = 1; i15 <= parseInt(this.endDay); i15++) {
                  this.days.push(i15 + '日');
                }
              } else {
                for (var i16 = 1; i16 <= 29; i16++) {
                  this.days.push(i16 + '日');
                }
              }
            } else {
              if (parseInt(this.beginDay) < 0 || parseInt(this.beginDay) > 28) {
                this.beginDay = 1;
              }
              if (parseInt(this.endDay) < 0 || parseInt(this.endDay) > 28) {
                this.endDay = 28;
              }
              if (
                parseInt(this.beginYear) == parseInt(this.year) &&
                parseInt(this.endYear) == parseInt(this.year) &&
                parseInt(this.beginMonth) == parseInt(this.month) &&
                parseInt(this.endMonth) == parseInt(this.month)
              ) {
                for (var i17 = parseInt(this.beginDay); i17 <= parseInt(this.endDay); i17++) {
                  this.days.push(i17 + '日');
                }
              } else if (
                (parseInt(this.beginYear) == parseInt(this.year) &&
                  parseInt(this.endYear) == parseInt(this.year) &&
                  parseInt(this.beginMonth) == parseInt(this.month)) ||
                (parseInt(this.beginYear) >= parseInt(this.year) &&
                  parseInt(this.beginMonth) == parseInt(this.month))
              ) {
                for (var i18 = parseInt(this.beginDay); i18 <= 28; i18++) {
                  this.days.push(i18 + '日');
                }
              } else if (
                (parseInt(this.beginYear) == parseInt(this.year) &&
                  parseInt(this.endYear) == parseInt(this.year) &&
                  parseInt(this.endMonth) == parseInt(this.month)) ||
                (parseInt(this.endYear) <= parseInt(this.year) &&
                  parseInt(this.endMonth) == parseInt(this.month))
              ) {
                for (var i19 = 1; i19 <= parseInt(this.endDay); i19++) {
                  this.days.push(i19 + '日');
                }
              } else {
                for (var i20 = 1; i20 <= 28; i20++) {
                  this.days.push(i20 + '日');
                }
              }
            }
          }
          break;
      }
    },
    getDate() {
      var date = new Date();
      this.year = date.getFullYear();
      if (parseInt(this.beginYear) > parseInt(this.year)) {
        this.year = this.beginYear;
        this.month = this.beginMonth;
        this.day = this.beginDay;
      } else if (parseInt(this.endYear) < parseInt(this.year)) {
        this.year = this.endYear;
        this.month = this.endMonth;
        this.day = this.endDay;
      } else {
        this.month = date.getMonth() + 1;
        this.day = date.getDate();
      }

      this.hour = date.getHours();
      this.minute = date.getMinutes();
      this.second = date.getSeconds();
    },
    getData() {
      this.dates = [];
      let yearIndex = 0;
      let monthIndex = 0;
      let dayIndex = 0;
      let hourIndex = 0;
      let minuteIndex = 0;
      let secondIndex = 0;
      let pamIndex = 0;
      switch (this.showMode) {
        case 'year':
          {
            this.dates.push(this.years);
            this.years.map((item, index) => {
              if (this.year == item.substring(0, 4)) {
                yearIndex = index;
              }
            });
            this.value = [yearIndex];
          }
          break;
        case 'month':
          {
            this.dates.push(this.months);
            this.months.map((item, index) => {
              if (this.month == item.substring(0, item.length - 1)) {
                monthIndex = index;
              }
            });
            this.value = [monthIndex];
          }
          break;
        case 'day':
          {
            this.dates.push(this.days);
            this.days.map((item, index) => {
              if (this.day == item.substring(0, item.length - 1)) {
                dayIndex = index;
              }
            });
            this.value = [dayIndex];
          }
          break;
        case 'hour':
          {
            this.dates.push(this.hours);
            this.hours.map((item, index) => {
              if (this.hour == item.substring(0, item.length - 1)) {
                hourIndex = index;
              }
            });
            this.value = [hourIndex];
          }
          break;
        case 'minute':
          {
            this.dates.push(this.minutes);
            this.minutes.map((item, index) => {
              if (this.minute == item.substring(0, item.length - 1)) {
                minuteIndex = index;
              }
            });
            this.value = [minuteIndex];
          }
          break;
        case 'second':
          {
            this.dates.push(this.seconds);
            this.seconds.map((item, index) => {
              if (this.second == item.substring(0, item.length - 1)) {
                secondIndex = index;
              }
            });
            this.value = [secondIndex];
          }
          break;
        case 'yearToMonth':
          {
            this.dates.push(this.years);
            this.dates.push(this.months);
            this.years.map((item, index) => {
              if (this.year == item.substring(0, 4)) {
                yearIndex = index;
              }
            });
            this.months.map((item, index) => {
              if (this.month == item.substring(0, item.length - 1)) {
                monthIndex = index;
              }
            });
            this.value = [yearIndex, monthIndex];
          }
          break;
        case 'monthToDay':
          {
            this.dates.push(this.months);
            this.dates.push(this.days);
            this.months.map((item, index) => {
              if (this.month == item.substring(0, item.length - 1)) {
                monthIndex = index;
              }
            });
            this.days.map((item, index) => {
              if (this.day == item.substring(0, item.length - 1)) {
                dayIndex = index;
              }
            });
            this.value = [monthIndex, dayIndex];
          }
          break;
        case 'hourToMinute':
          {
            this.dates.push(this.hours);
            this.dates.push(this.minutes);
            this.hours.map((item, index) => {
              if (this.hour == item.substring(0, item.length - 1)) {
                hourIndex = index;
              }
            });
            this.minutes.map((item, index) => {
              if (this.minute == item.substring(0, item.length - 1)) {
                minuteIndex = index;
              }
            });
            this.value = [hourIndex, minuteIndex];
          }
          break;
        case 'minuteToSecond':
          {
            this.dates.push(this.minutes);
            this.dates.push(this.seconds);
            this.minutes.map((item, index) => {
              if (this.minute == item.substring(0, item.length - 1)) {
                minuteIndex = index;
              }
            });
            this.seconds.map((item, index) => {
              if (this.second == item.substring(0, item.length - 1)) {
                secondIndex = index;
              }
            });
            this.value = [minuteIndex, secondIndex];
          }
          break;
        case 'date':
          {
            this.dates.push(this.years);
            this.dates.push(this.months);
            this.dates.push(this.days);
            this.years.map((item, index) => {
              if (this.year == item.substring(0, 4)) {
                yearIndex = index;
              }
            });
            this.months.map((item, index) => {
              if (this.month == item.substring(0, item.length - 1)) {
                monthIndex = index;
              }
            });
            this.days.map((item, index) => {
              if (this.day == item.substring(0, item.length - 1)) {
                dayIndex = index;
              }
            });
            this.value = [yearIndex, monthIndex, dayIndex];
          }
          break;
        case 'time':
          {
            this.dates.push(this.hours);
            this.dates.push(this.minutes);
            this.dates.push(this.seconds);
            this.hours.map((item, index) => {
              if (this.hour == item.substring(0, item.length - 1)) {
                hourIndex = index;
              }
            });
            this.minutes.map((item, index) => {
              if (this.minute == item.substring(0, item.length - 1)) {
                minuteIndex = index;
              }
            });
            this.seconds.map((item, index) => {
              if (this.second == item.substring(0, item.length - 1)) {
                secondIndex = index;
              }
            });
            this.value = [hourIndex, minuteIndex, secondIndex];
          }
          break;
        case 'yearToMinute':
          {
            this.dates.push(this.years);
            this.dates.push(this.months);
            this.dates.push(this.days);
            this.dates.push(this.hours);
            this.dates.push(this.minutes);
            this.years.map((item, index) => {
              if (this.year == item.substring(0, 4)) {
                yearIndex = index;
              }
            });
            this.months.map((item, index) => {
              if (this.month == item.substring(0, item.length - 1)) {
                monthIndex = index;
              }
            });
            this.days.map((item, index) => {
              if (this.day == item.substring(0, item.length - 1)) {
                dayIndex = index;
              }
            });
            this.hours.map((item, index) => {
              if (this.hour == item.substring(0, item.length - 1)) {
                hourIndex = index;
              }
            });
            this.minutes.map((item, index) => {
              if (this.minute == item.substring(0, item.length - 1)) {
                minuteIndex = index;
              }
            });
            this.value = [yearIndex, monthIndex, dayIndex, hourIndex, minuteIndex];
          }
          break;
        case 'monthToMinute':
          {
            this.dates.push(this.months);
            this.dates.push(this.days);
            this.dates.push(this.hours);
            this.dates.push(this.minutes);
            this.months.map((item, index) => {
              if (this.month == item.substring(0, item.length - 1)) {
                monthIndex = index;
              }
            });
            this.days.map((item, index) => {
              if (this.day == item.substring(0, item.length - 1)) {
                dayIndex = index;
              }
            });
            this.hours.map((item, index) => {
              if (this.hour == item.substring(0, item.length - 1)) {
                hourIndex = index;
              }
            });
            this.minutes.map((item, index) => {
              if (this.minute == item.substring(0, item.length - 1)) {
                minuteIndex = index;
              }
            });
            this.value = [monthIndex, dayIndex, hourIndex, minuteIndex];
          }
          break;
        case 'yearToPA':
          {
            this.dates.push(this.years);
            this.dates.push(this.months);
            this.dates.push(this.days);
            this.dates.push(this.pams);
            this.years.map((item, index) => {
              if (this.year == item.substring(0, 4)) {
                yearIndex = index;
              }
            });
            this.months.map((item, index) => {
              if (this.month == item.substring(0, item.length - 1)) {
                monthIndex = index;
              }
            });
            this.days.map((item, index) => {
              if (this.day == item.substring(0, item.length - 1)) {
                dayIndex = index;
              }
            });
            this.pams.map((item, index) => {
              if (this.pam == item.substring(0, item.length - 1)) {
                pamIndex = index;
              }
            });
            this.value = [yearIndex, monthIndex, dayIndex, pamIndex];
          }
          break;
        case 'monthToPA':
          {
            this.dates.push(this.months);
            this.dates.push(this.days);
            this.dates.push(this.pams);
            this.months.map((item, index) => {
              if (this.month == item.substring(0, item.length - 1)) {
                monthIndex = index;
              }
            });
            this.days.map((item, index) => {
              if (this.day == item.substring(0, item.length - 1)) {
                dayIndex = index;
              }
            });
            this.pams.map((item, index) => {
              if (this.pam == item.substring(0, item.length - 1)) {
                pamIndex = index;
              }
            });
            this.value = [monthIndex, dayIndex, pamIndex];
          }
          break;

        default:
          {
            this.dates.push(this.years);
            this.dates.push(this.months);
            this.dates.push(this.days);
            this.dates.push(this.hours);
            this.dates.push(this.minutes);
            this.dates.push(this.seconds);
            this.years.map((item, index) => {
              if (this.year == item.substring(0, 4)) {
                yearIndex = index;
              }
            });
            this.months.map((item, index) => {
              if (this.month == item.substring(0, item.length - 1)) {
                monthIndex = index;
              }
            });
            this.days.map((item, index) => {
              if (this.day == item.substring(0, item.length - 1)) {
                dayIndex = index;
              }
            });
            this.hours.map((item, index) => {
              if (this.hour == item.substring(0, item.length - 1)) {
                hourIndex = index;
              }
            });
            this.minutes.map((item, index) => {
              if (this.minute == item.substring(0, item.length - 1)) {
                minuteIndex = index;
              }
            });
            this.seconds.map((item, index) => {
              if (this.second == item.substring(0, item.length - 1)) {
                secondIndex = index;
              }
            });
            this.value = [yearIndex, monthIndex, dayIndex, hourIndex, minuteIndex, secondIndex];
          }
          break;
      }
      console.log(this.dates);
    },
    // 日期转为时间戳
    getMillisecond(date) {
      return new Date(date).getTime();
    },
  },
};
</script>

<style></style>
