import { App, ButtonComponent, DropdownComponent, Modal, Setting } from "obsidian";
import { LinkTreeType, SlideType } from "src/types";
import { Checkbox } from "./index";

export class SlidesModal extends Modal {
	onSubmit: (slides: SlideType[], titleSlide: boolean, lastSlide: boolean) => void;
	linksEl: Element;
	links: LinkTreeType[];
	flattenedLinks: LinkTreeType[] = [];
	slides: SlideType[];
	ignoredLinks: string[];
	depth: number;
	maxDepth = 1;
	titleSlide: boolean = false;
	lastSlide: boolean = false;

	constructor(app: App, links: LinkTreeType[], ignoredLinks: string[], onSubmit: (slides: SlideType[], titleSlide: boolean, lastSlide: boolean) => void) {
		super(app);
		this.links = links;
		this.ignoredLinks = ignoredLinks;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.empty();
		contentEl.createEl("h1", { text: "Slideshow" });

		this.flattenLinks(this.links);

		const settingsEl = contentEl.createEl('div');

		const depthStr = (depth: number) => `Slides depth: ${depth}`;

		this.depth = this.maxDepth;

		contentEl.createEl('div', { text: 'Include: '})

		const titleSlideEl = contentEl.createEl('div');
		new Checkbox(titleSlideEl, this.titleSlide, true, () => {
			this.titleSlide = !this.titleSlide;
			this.render();
		})
		titleSlideEl.createEl('span', { text: 'title slide'})

		const lastSlideEl = contentEl.createEl('div');
		new Checkbox(lastSlideEl, this.lastSlide, true, () => {
			this.lastSlide = !this.lastSlide;
			this.render();
		})
		lastSlideEl.createEl('span', { text: 'last slide'})
		
		this.linksEl = contentEl.createEl('div');

		new Setting(settingsEl)
			.setName(depthStr(this.maxDepth))
			.setDesc('Set depth of preview content to create slides from.')
			.addSlider(slider => slider
				.setValue(this.maxDepth)
				.setLimits(1, this.maxDepth, 1)
				.onChange(async (value) => {
					const depthEl = settingsEl.children[0].children[0].children[0];
					depthEl.empty()
					depthEl.createEl('div', { text: depthStr(value)});
					this.depth = value;
					slider.showTooltip();

					this.render();
				}));
		
		this.render();

		new ButtonComponent(contentEl).setButtonText('Generate').onClick(() => {
			this.onSubmit(this.slides, this.titleSlide, this.lastSlide);
			this.close();
		})
	}

	flattenLinks(links: LinkTreeType[]) {
		links.forEach((link: LinkTreeType) => {
			if (this.ignoredLinks.includes(link.name))
				return

			if (link.level && this.maxDepth <= link.level) 
				this.maxDepth = link.level;

			this.flattenedLinks.push(link);
			if ('children' in link && link.level) {
				this.flattenLinks(link.children);
			}
		})
	}

	render() {
		this.linksEl.empty();
		const depthLinks = this.flattenedLinks
			.filter((link: LinkTreeType) => link.level && link.level <= this.depth)
			.filter((link: LinkTreeType) => link.exists);

		this.slides = depthLinks.map((link: LinkTreeType) => ({ link: link, type: 'basic' }))
		
		if (this.titleSlide) {
			const slide = this.linksEl.createEl("div", { cls: 'slide-row'});
			slide.createEl('span', { text: '1. Title slide' });
			const dropdownEl = slide.createEl('span', { cls: 'row-right'})
			new DropdownComponent(dropdownEl)
				.setDisabled(true)
				.addOption("title", "title")
		}
		
		depthLinks.forEach((link: LinkTreeType) => {
			const slide = this.linksEl.createEl("div", { cls: 'slide-row'});
			slide.createEl('span', { text: `${link.level}: ${link.name}` });

			const dropdownEl = slide.createEl('span', { cls: 'row-right'});
			new DropdownComponent(dropdownEl)
				.addOption("basic", "basic")
				.addOption("split", "split")
				.addOption('image', 'image')
				.onChange((value: string) => {

					// update slides with new type of slide value
					const index = this.slides.findIndex(({ link: slideLink }: { link: LinkTreeType}) => slideLink.name === link.name);
					this.slides[index]['type'] = value;
				});
		})

		if (this.lastSlide) {
			const slide = this.linksEl.createEl("div", { cls: 'slide-row'});
			slide.createEl('span', { text: '1. Last slide' });
			const dropdownEl = slide.createEl('span', { cls: 'row-right'})
			new DropdownComponent(dropdownEl)
				.setDisabled(true)
				.addOption("last", "last")
		}
	}

	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}
}
