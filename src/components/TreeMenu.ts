import { App } from 'obsidian';
import { LinkTreeType } from 'src/types';
import {
	Link, Checkbox
} from './index';


function flattenChildren(link: LinkTreeType, children: string[]) {
	if ('children' in link) {
		const childrenLinkNames = link.children.map((l: LinkTreeType) => l.name); 
		children.push(...childrenLinkNames);
		link.children.forEach((l: LinkTreeType) => {
			flattenChildren(l, children);
		})
	}
	return children;
}

export class TreeMenu {
	app: App;
	UL: Element;

	ignoredLinks: string[] = [];
	linksTree: LinkTreeType[] = [];

	constructor(app: App, structure: Element, linksTree: LinkTreeType[], event: (ignoredLinks: string[]) => void) {
		this.app = app;
		let menu = structure.createEl('div', { cls: 'tree-menu'});
		this.UL = menu.createEl('ul');
		this.linksTree = linksTree;

		this.render(this.linksTree, this.UL, [], event);
	}

	render(links: LinkTreeType[], menuEl: Element, childrenLinks: string[], event: (links: string[]) => void) {
		if (!childrenLinks) 
			childrenLinks = [];

		links.forEach((link: LinkTreeType) => {
			const li = menuEl.createEl('li');
			const linkEl = new Link(this.app, li, link, false);

			let state: boolean = !childrenLinks.includes(linkEl.link.name);

			if (!link.exists)
				state = false; 

			new Checkbox(li, state, link.exists, () => {
				const ignoredChildren = [linkEl.link.name, ...flattenChildren(linkEl.link, [])];

				if (state == false) { 
					// remove children from childrenLinks
					childrenLinks = childrenLinks.filter((cl: string) => !ignoredChildren.includes(cl));
				} else {
					childrenLinks.push(...ignoredChildren);
					
					// remove dupes
					childrenLinks = [...new Set(childrenLinks)]
				}

				this.ignoredLinks = childrenLinks;
				
				// cleanup and rerender
				this.UL.empty()
				this.render(this.linksTree, this.UL, childrenLinks, event);
			});

			linkEl.render(state);

			if ('children' in link) {
				const ul = li.createEl('ul');
				this.render(link.children, ul, childrenLinks, event);
			}
		});

		return event(this.ignoredLinks);
	}
}
