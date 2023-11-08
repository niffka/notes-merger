export class Button {
	btn: HTMLButtonElement;

	constructor(element: Element, text: string, onClick: (context: Button) => void, args?: object) {
		this.btn = element.createEl('button', { text, ...args });
		this.btn.onclick = () => {
			onClick(this);
		};	
		return this;
	}
}
