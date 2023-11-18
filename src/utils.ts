import { TFile, App } from 'obsidian';

export const fixSpaceInName = (name: string) => {
	return name.replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/, " ").trim();
}

export const getNoteByName = async (app: App, path: string) => {
	const file = app.vault.getAbstractFileByPath(path);

	if (!(file instanceof TFile))
		return "";	

	return await app.vault.cachedRead(file);
}
