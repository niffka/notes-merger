import { App } from "obsidian";
import { LinkTreeType } from "src/views/generate-markdown";

export class BaseLink {
	context: App;
	element: Element;
	name: string;

	constructor(context: App, element: Element, name: string) {
		this.context = context;
		this.element = element;
		this.name = name;

		this.render();
	}

	render() {
		const hrefTitle = this.element.createEl('a', { text: this.name, cls: 'cont__title' });
		hrefTitle.onclick = () => {
			this.context.workspace.openLinkText(this.name, "");
		}
	}

}

// Link with inner state and helper fncs
export class Link {

	context: App;
	a: HTMLElement;
	link: LinkTreeType;
	element: Element;
	toggledState: boolean = false;

	constructor(context: App, element: Element, link: LinkTreeType, renderNow: boolean = true) {
		this.link = link;
		this.context = context;
		this.element = element;

		if (renderNow)
			this.render(false);

		return this;
	}

	render(state: boolean) {
		this.a = this.element.createEl('a', { text: this.link.name, cls: "link" });
		!this.link.exists && this.a.addClass("cont__link-not-exist");
		this.link.inline && this.a.addClass("inline");
		this.a.onclick = () => {
			this.context.workspace.openLinkText(this.link.name, "");
			!this.link.exists && this.a.removeClass("cont__link-not-exist");
		};

		this.toggle(state);
	}

	toggle(state: boolean) {
		if (state)
			this.a.removeClass('strikethrough');
		else
			this.a.addClass('strikethrough');
	}
}
