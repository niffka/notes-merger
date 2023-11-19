import { SlideType } from "src/types";

export class SlidesMarkdown {

	slides: SlideType[] = [];
	slideshow: string = "";

	constructor(slides: SlideType[], title: string, hasTitleSlide: boolean, hasLastSlide: boolean) {
		this.slides = slides;

		this.slideshow += this.createProperties();

		if (hasTitleSlide)
			this.slideshow += this.createTitleSlide(title);
		
		slides.forEach((slide: SlideType) => {
			if (slide.type === 'basic')
				this.slideshow += this.createBasicSlide(slide.link.name);
			else if (slide.type === 'split')
				this.slideshow += this.createSplitSlide(slide.link.name);
		});

		if (hasLastSlide)
			this.slideshow += this.createLastSlide();

		return this;
	}

	createProperties() {
		return `---\n` + 
				`theme: consult\n` + 
				`height: 540\n` + 
				`margin: 0\n` +
				`maxScale: 4\n` + 
				`---\n\n`;
	}

	createTitleSlide(title: string) {
		return `\n<!-- slide template="[[tpl-con-title]]" -->\n\n` +
				`## ${title}\n` + 
				`::: block\n` + 
				`#### add author here\n` +
				`:::\n\n`;
	}

	createLastSlide() {
		return `\n---\n` +
			`<!-- slide template="[[tpl-con-splash]]" -->\n\n` +
			`# **Thank you for your attention**\n\n`;
	}

	createBasicSlide(name: string) {
		return `\n---\n` + 
			`<!-- slide template="[[tpl-con-default-box]]" -->\n\n` +
			`::: title\n` +
			`### _**${name}**_\n` +
			`:::\n\n` +
			`::: block\n` + 
			`-\n` + 
			`-\n` +
			`-\n` +
			`:::\n\n`;
	}

	createSplitSlide(name: string) {
		return `\n---\n` + 
			`<!-- slide template="[[tpl-con-2-1-box]]" -->\n\n` +
			`::: title\n` + 
			`### _**${name}**_\n` +
			`:::\n\n` + 
			`::: left\n` + 
			`**text in left box**\n` + 
			`- lorem ipsum\n` +
			`-\n` + 
			`-\n` +
			`:::\n\n` +
			`::: right\n` +
			`**text in right box**\n` + 
			`- lorem ipsum\n` + 
			`-\n` +  
			`-\n` +
			`:::\n\n`;
	}
}
