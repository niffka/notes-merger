import * as fs from 'fs';
import * as Path from 'path';
import { SlideType } from "src/types";
import { tpl_con_title, tpl_con_last, tpl_con_basic, tpl_con_image, tpl_con_split } from 'src/slideshow-template/default';
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
			else if (slide.type === 'image')
				this.slideshow += this.createImageSlide(slide.link.name);
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
		return `\n<!-- slide template="[[tpl_con_title]]" -->\n\n` +
				`::: title\n\n` + 
				`## _${title}_\n` +
				`:::\n\n` +
				`::: source\n\n` + 
				`###### add author here\n` +
				`:::\n\n`;
	}

	createLastSlide() {
		return `\n---\n` +
			`<!-- slide template="[[tpl_con_last]]" -->\n\n` +
			`#### _Ďakujem za pozornosť_\n\n`;
	}

	createBasicSlide(name: string) {
		return `\n---\n` + 
			`<!-- slide template="[[tpl_con_basic]]" -->\n\n` +
			`::: title\n` +
			`### _**${name}**_\n` +
			`:::\n\n` +
			`::: block\n` + 
			`-\n` + 
			`-\n` +
			`-\n` +
			`:::<!-- element style="font-size:16px;color:black;font-weight:600;line-height:1.9" pad="20px 0" -->\n\n`;
	}

	createImageSlide(name: string) {
		return `\n---\n` + 
		`<!-- slide template="[[tpl_con_image]]" -->\n\n` +

		`::: title\n`+
		`### _**${name}**_\n`+
		`:::\n\n`+
		
		`:::middle\n`+
		`![[write name of image here|number of pixels]]\n`+
		`:::<!-- element align="center" -->\n\n` +
		
		`::: source\n` +
		`###### Write description and source here.\n` +
		`:::\n\n`;
	}

	createSplitSlide(name: string) {
		return `\n---\n` + 
			`<!-- slide template="[[tpl_con_split]]" -->\n\n` +
			`::: title\n` + 
			`### _**${name}**_\n` +
			`:::\n\n` + 
			`::: left\n` + 
			`#### **text in left box**\n` + 
			`- lorem ipsum\n` +
			`-\n` + 
			`-\n` +
			`:::<!-- element style="font-size:14px;color:black;font-weight:500;line-height:1.9" pad="20px 20px" -->\n\n` +
			`::: right\n` +
			`![[write name of image here|number of pixels]]\n`+
			`:::<!-- element align="center" -->\n\n`+
			`::: source\n` +
			`###### Write description and source here.\n` +
			`:::\n\n`;
			
	}

	copyTemplates() {
		// @ts-ignore
		const basePath = app.vault.adapter.basePath;
		const vaultPath = Path.join(basePath, 'slideshow-templates');

		if (!fs.existsSync(vaultPath))
			fs.mkdirSync(vaultPath);

		const templates: Record<string, string> = {tpl_con_title, tpl_con_last, tpl_con_basic, tpl_con_image, tpl_con_split};

		Object.keys(templates).forEach((templateName: string) => {
			fs.writeFileSync(Path.join(vaultPath, `${templateName}.md`), templates[templateName]);
		});
	}
}
