export default {
	props: {
		size: {
			type: String,
			default: "400px"
		},
		centerImage: {
			type: String,
			default: ""
		},
		imageType: {
			type: String,
			default: "png"
		},
		hidden: {
			type: Boolean,
			default: false
		},
		inCircle: {
			type: Boolean,
			default: false
		},
		companyText: {
			type: String,
			default: ""
		},
		sealCode: {
			type: String,
			default: ""
		},
		sealText: {
			type: String,
			default: ""
		},
		color: {
			type: String,
			default: "red"
		},
	}
}