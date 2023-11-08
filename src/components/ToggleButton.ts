export class ToggleButton {

	btn: HTMLButtonElement;
	constructor(element: Element, state: boolean, onClick: (context: ToggleButton) => void) {
		this.btn = element.createEl('button', { text: state ? '-' : '+'});
		this.btn.onclick = () => {
			this.btn.innerText = state ? '+' : '-';
			
			onClick(this);
		};	
		return this;
	}

	getToggledState() {
		return this.btn.innerText == '-';
	}
}
