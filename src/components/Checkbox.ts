export class Checkbox {

	cb: HTMLInputElement;
	constructor(element: Element, state: boolean, exists: boolean, onClick: (context: Checkbox) => void) {
		this.cb = element.createEl("input", {
			type: 'checkbox',
			cls: 'checkbox-btn'
		});

		this.cb.checked = state;

		if (!exists) {
			this.cb.disabled = true;
			this.cb.checked = false;
			this.cb.addClass('checkbox-btn-disabled');
		}
		this.cb.onclick = () => {
			onClick(this);
		};	
		return this;
	}
}
