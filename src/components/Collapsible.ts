import { CitationType } from "src/types";

export class CollapsibleCitation {
	link: HTMLElement;
    expandable: HTMLDivElement;

    stateClasses = {
        visible: 'expandable-section-visible',
        hidden: 'expandable-section-hidden'
    }

	constructor(element: Element, content: CitationType, state: boolean) {
		this.link = element.createEl('a', { text: state ? 'Show less' : 'Show more' });
		this.link.onclick = () => {
            this.link.innerText = this.link.innerText === 'Show more' ? 'Show less' : 'Show more';

            this.expandable.classList.toggle(this.stateClasses.visible);
            this.expandable.classList.toggle(this.stateClasses.hidden);

		};
        this.expandable = element.createEl(
            'div', { 
                cls: state ? this.stateClasses.visible : this.stateClasses.hidden
            }
        );
        const table = this.expandable.createEl('table');
        Object.keys(content).forEach((key: keyof CitationType) => {
            const tr = table.createEl('tr');
            
            if (Array.isArray(content[key])) {
                const arr = content[key] as string[]; 
                arr.forEach((item: string) => {
                    const subTr = table.createEl('tr')
                    subTr.createEl('th', { text: key }).setAttr("align", "left");
                    subTr.createEl('td', { text: item as string || "–⁠⁠⁠⁠⁠⁠⁠⁠⁠" });
                })
                
            } else {
                tr.createEl('th', { text: key }).setAttr("align", "left");
                tr.createEl('td', { text: content[key] as string || "–⁠⁠⁠⁠⁠⁠⁠⁠⁠" });
            }
        });

		return this;
	}
}
