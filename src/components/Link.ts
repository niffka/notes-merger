import { App } from "obsidian";
import { LinkTreeType } from "src/types";
import {
	WarningIcon,
	ErrorIcon
} from '../components/index';

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
		const hrefTitle = this.element.createEl('a', { text: this.name, cls: 'title' });
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

		if (!this.link.exists) {
			this.a.createEl('span', { 
				cls: 'tooltip-container', 
				text: 'Warning: Note doesn\'t exist.'
			});

			this.a.addClass("link-not-exist");
			this.a.createEl('i', { cls: 'not-found-icon'}).appendChild(new ErrorIcon('#624e9f').element);
			this.a.addClass('tooltip-parent');
		} else if (this.link.incomplete) {
			this.a.createEl('span', { 
				cls: 'tooltip-container', 
				text: 'Warning: Note is incomplete.'
			});

			this.a.addClass("link-incomplete");
			this.a.createEl('i', { cls: 'warning-icon'}).appendChild(new WarningIcon().element);
			this.a.addClass('tooltip-parent');

		}
		this.link.inline && this.a.addClass("inline");
		this.a.onclick = () => {
			this.context.workspace.openLinkText(this.link.path, "");
			!this.link.exists && this.a.removeClass("link-not-exist");
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
