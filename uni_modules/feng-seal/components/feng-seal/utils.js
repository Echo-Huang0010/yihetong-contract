export function toPx(value) {
	if (value && value.indexOf("rpx") >= 0) {
		let data = value.replace("rpx", "")
		return uni.upx2px(data);
	} else if (value && value.indexOf("px") >= 0) {
		return value.replace("px", "");
	}
}

export function getFontSize(size) {
	const companyFontSize = parseInt(size / 10 / 1.2);
	const sealTextFontSize = parseInt(size / 10 / 1.5);
	const sealCodeFontSize = parseInt(size / 10 / 2.5);

	return {
		companyFontSize,
		sealTextFontSize,
		sealCodeFontSize
	}
}