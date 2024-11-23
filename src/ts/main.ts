const RELIANT_VERSION: string = browser.runtime.getManifest().version;
let freshlyAdmitted: boolean = false;

/*
 * Types
 */

interface Switcher {
	name: string;
	appid: string;
}

/*
 * Helpers
 */

async function getStorageValue(key: string): Promise<any> {
	const result = await browser.storage.local.get(key);
	return result[key];
}

async function setStorageValue(key: string, value: any): Promise<void> {
	await browser.storage.local.set({ [key]: value });
}

async function setDefaultStorageValues(): Promise<void> {
	const defaultValues: { key: string; value: any }[] = [
		{ key: 'jumppoint', value: 'artificial_solar_system' },
		{ key: 'roname', value: 'Reliant' },
		{ key: 'blockedregions', value: [] },
		{ key: 'dossierkeywords', value: [] },
		{ key: 'endorsekeywords', value: [] },
		{ key: 'prepswitchers', value: [] },
		{ key: 'switchers', value: [] },
		{ key: 'raiderjp', value: 'suspicious' }
	];

	for (const { key, value } of defaultValues) {
		if ((await getStorageValue(key)) === undefined) {
			await setStorageValue(key, value);
		}
	}
}

async function dieIfNoUserAgent(): Promise<void> {
	const userAgent: string = await getStorageValue('useragent');
	if (userAgent) return;
	const cancellationNotyf = new Notyf({
		duration: 0,
		position: {
			x: 'right',
			y: 'top'
		},
		dismissible: false
	});
	Array.from(document.querySelectorAll('input'))
		.filter((input) => input.id !== 'reliant-settings')
		.forEach((input) => (input.disabled = true));
	cancellationNotyf.error('Please set your "Main Nation" in the <a href="/page=blank/reliant=settings">settings.</a>');
	throw new Error('No User Agent');
}

function canonicalize(str: string): string {
	return str.trim().toLowerCase().replace(/ /g, '_');
}

function getUrlParameters(url: string): object {
	const reg: RegExp = new RegExp('/([A-Za-z0-9-]+?)=([A-Za-z0-9_.+]+)', 'g');
	let params: object = {};
	let match: string[];
	while ((match = reg.exec(url)) !== null) params[match[1]] = match[2];
	return params;
}

function pretty(str: string): string {
	return str.replace(/_/g, ' ').replace(/\w+\s*/g, (txt: string) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

function getLocalId(page?: string): void {
	const localId: HTMLInputElement = document.querySelector('input[name=localid]');
	if (localId) browser.storage.local.set({ localid: localId.value });
	else if (page) {
		const localIdRegex: RegExp = new RegExp('<input type="hidden" name="localid" value="([A-Za-z0-9]+?)">');
		const match = localIdRegex.exec(page);
		browser.storage.local.set({ localid: match[1] });
	} else return;
}

function getChk(page?: string): void {
	const chk: HTMLInputElement = document.querySelector('input[name=chk]');
	if (chk) browser.storage.local.set({ chk: chk.value });
	else if (page) {
		const chkRegex: RegExp = new RegExp('<input type="hidden" name="chk" value="([A-Za-z0-9]+?)">');
		const match: string[] = chkRegex.exec(page);
		browser.storage.local.set({ chk: match[1] });
	} else return;
}

let inQuery = false;

async function makeAjaxQuery(url: string, method: string, data?: FormData, admit: boolean = false): Promise<string> {
	const userAgent = (await browser.storage.local.get('useragent')).useragent;

	if (inQuery) return;
	let startTime = Date.now();

	// Recommended by Eluvatar: https://forum.nationstates.net/viewtopic.php?p=30083979#p30083979
	const fixedUrl: string = `${url}?script=reliant_${RELIANT_VERSION}_by_Haku_in_use_by_${userAgent}&userclick=${Date.now()}`;
	let request: Request;
	// redirect required if admitting to the WA
	if (!admit) {
		request = new Request(fixedUrl, {
			method: method,
			redirect: 'manual',
			body: data ?? null,
			credentials: 'include'
		});
	} else {
		request = new Request(fixedUrl, {
			method: method,
			redirect: 'follow',
			body: data ?? null,
			credentials: 'include'
		});
	}

	// Each button with class 'ajaxbutton' make a request to the NS webiste.
	// In order to abide by rule "4. Avoid Simultaneous Requests" we will keep all buttons
	// with this class disabled until we receive a complete response from the NS server.
	let ajaxButtons: NodeList = document.querySelectorAll('.ajaxbutton');
	for (let i = 0; i != ajaxButtons.length; i++) (ajaxButtons[i] as HTMLInputElement).disabled = true;

	inQuery = true;
	const response: Response = await fetch(request);

	let ret = await response.text();

	// We've received a complete response from the NS server, so we can allow more user input
	for (let i = 0; i != ajaxButtons.length; i++) (ajaxButtons[i] as HTMLInputElement).disabled = false;

	inQuery = false;

	if (document.querySelector('#load-time')) (document.querySelector('#load-time') as HTMLSpanElement).innerHTML = String(Date.now() - startTime) + ' ms';
	return ret;
}

function redirectPage(url: string): void {
	let ajaxButtons: NodeList = document.querySelectorAll('.ajaxbutton');
	// Disable all buttons until the page is fully redirected, though this is likely unnecessary
	for (let i = 0; i != ajaxButtons.length; i++) (ajaxButtons[i] as HTMLInputElement).disabled = true;
	window.location.href = url;
}

const urlParameters: object = getUrlParameters(document.URL);
if (urlParameters['page'] !== 'blank') {
	getLocalId();
	getChk();
}

/*
 * Keybind Handling
 */

function keyPress(e: KeyboardEvent): void {
	const textboxSelected: HTMLElement = document.querySelector('input:focus, textarea:focus');
	if (e.ctrlKey || e.altKey) return;
	else if (textboxSelected) return;
	// ignore caps lock
	const pressedKey: string = e.key.toUpperCase();
	if (pressedKey in keys) keys[pressedKey]();
}

document.addEventListener('keyup', keyPress);

/*
 * Keybind Functionality
 */

let keys: object = {};

browser.storage.local.get('movekey').then((result) => {
	const moveKey = result.movekey || 'X';
	keys[moveKey] = () => {
		const moveButton: HTMLButtonElement = document.querySelector('button[name=move_region]');
		if (moveButton) moveButton.click();
		else if (urlParameters['reliant'] === 'main') (document.querySelector('#chasing-button') as HTMLInputElement).click();
		else if (urlParameters['region']) {
			const updateLocalIdButton: HTMLInputElement = document.querySelector('.updatelocalid[data-clicked="0"]');
			if (updateLocalIdButton) updateLocalIdButton.click();
			else (document.querySelector('#action-button') as HTMLInputElement).click();
		}
	};
});

browser.storage.local.get('jpkey').then((result) => {
	browser.storage.local.get('jumppoint').then((jpresult) => {
		const jpKey = result.jpkey || 'V';
		const jumpPoint = jpresult.jumppoint || 'artificial_solar_system';
		keys[jpKey] = () => {
			const moveButton: HTMLButtonElement = document.querySelector('button[name=move_region]');
			if (urlParameters['region'] === jumpPoint) moveButton.click();
			else if (urlParameters['reliant'] === 'main') (document.querySelector('#move-to-jp') as HTMLInputElement).click();
			else window.location.href = `/template-overall=none/region=${jumpPoint}`;
		};
	});
});

browser.storage.local.get('mainpagekey').then((result) => {
	const mainPageKey = result.mainpagekey || ' ';
	keys[mainPageKey] = () => {
		window.location.href = '/template-overall=none/page=blank/reliant=main';
	};
});

browser.storage.local.get('resignkey').then((result) => {
	const resignKey = result.resignkey || "'";
	keys[resignKey] = () => {
		if (urlParameters['page'] === 'join_WA') (document.querySelector('button[class="button primary icon approve big"]') as HTMLButtonElement).click();
		else if (urlParameters['reliant'] === 'main') {
			browser.storage.local.get('currentwa').then((currentwaresult) => {
				if (!freshlyAdmitted && currentwaresult.currentwa) (document.querySelector('#resign') as HTMLInputElement).click();
				else if (!freshlyAdmitted) (document.querySelector('#admit') as HTMLInputElement).click();
			});
		}
	};
});

browser.storage.local.get('dossierkey').then((result) => {
	const dossierKey = result.dossierkey || 'M';
	keys[dossierKey] = () => {
		if (urlParameters['page'] === 'dossier') (document.querySelector('button[name=clear_dossier]') as HTMLButtonElement).click();
		else window.location.href = '/template-overall=none/page=dossier';
	};
});

browser.storage.local.get('dossiernationkey').then((result) => {
	const dossierNationKey = result.dossiernationkey || 'N';
	keys[dossierNationKey] = () => {
		const dossierButton: HTMLButtonElement = document.querySelector('button[value=add]');
		if (dossierButton) dossierButton.click();
		else if (urlParameters['reliant'] === 'main') {
			let refreshButton: HTMLInputElement = document.querySelector('#refresh-dossier');
			let dossierButton: HTMLInputElement = document.querySelector('.dossier[data-clicked="0"]');
			if (!dossierButton) refreshButton.click();
			else dossierButton.click();
		}
	};
});

browser.storage.local.get('endorsekey').then((result) => {
	const endorseKey = result.endorsekey || 'Z';
	keys[endorseKey] = () => {
		const endorseButton: HTMLButtonElement = document.querySelector('button[class="endorse button icon wa"]');
		const crossEndorse: HTMLInputElement = document.querySelector('.cross');
		if (endorseButton) endorseButton.click();
		else if (crossEndorse) crossEndorse.click();
		else if (urlParameters['reliant'] === 'main') {
			let refreshButton: HTMLInputElement = document.querySelector('#refresh-endorse');
			let endorseButton: HTMLInputElement = document.querySelector('.endorse[data-clicked="0"]');
			const lastWAUpdate = document.querySelector('#last-wa-update');
			if (lastWAUpdate.innerHTML === 'Seconds ago') (document.querySelector('#copy-win') as HTMLInputElement).click();
			if (freshlyAdmitted) (document.querySelector('#update-localid') as HTMLInputElement).click();
			else {
				if (!endorseButton) refreshButton.click();
				else endorseButton.click();
			}
		} else if (urlParameters['region']) {
			let endorseButton: HTMLInputElement = document.querySelector('.endorse[data-clicked="0"]');
			let refreshButton: HTMLInputElement = document.querySelector('#refresh-endorse');
			if (!endorseButton) refreshButton.click();
			else endorseButton.click();
		}
	};
});

browser.storage.local.get('gcrkey').then((result) => {
	const gcrKey = result.gcrkey || 'G';
	keys[gcrKey] = () => {
		window.location.href = '/page=ajax2/a=reports/view=world/filter=change';
	};
});

browser.storage.local.get('viewregionkey').then((result) => {
	const viewRegionKey = result.viewregionkey || 'D';
	keys[viewRegionKey] = () => {
		const regionButton: HTMLDivElement = document.querySelector('.paneltext:first-of-type');
		if (regionButton) regionButton.click();
		else if (urlParameters['page'] === 'change_region') (document.querySelector('.info > a') as HTMLAnchorElement).click();
		else if (urlParameters['reliant'] === 'main') (document.querySelector('#open-region') as HTMLInputElement).click();
	};
});

browser.storage.local.get('didiupdatekey').then((result) => {
	const didIUpdateKey = result.didiupdatekey || 'U';
	keys[didIUpdateKey] = () => {
		if (urlParameters['reliant'] === 'main') (document.querySelector('#check-if-updated') as HTMLInputElement).click();
		else window.location.href = '/page=ajax2/a=reports/view=self/filter=change';
	};
});

browser.storage.local.get('delegatekey').then((result) => {
	const delegateKey = result.delegatekey || 'A';
	keys[delegateKey] = () => {
		if (urlParameters['region']) {
			const delegateNation = canonicalize(document.querySelector('#regioncontent > p:nth-child(2) > a > span > span.nname').innerHTML);
			window.location.href = `https://www.nationstates.net/nation=${delegateNation}`;
			return;
		}
		// Copy Nation Link
		else if (urlParameters['page'] === 'un') {
			let nationLink = 'https://www.nationstates.net/nation=' + document.getElementById('loggedin').getAttribute('data-nname');
			const copyText = document.createElement('textarea');
			copyText.value = nationLink;
			document.body.appendChild(copyText);
			copyText.select();
			document.execCommand('copy');
			document.body.removeChild(copyText);
		} else if (urlParameters['reliant'] === 'main') (document.querySelector('#endorse-delegate') as HTMLInputElement).click();
	};
});

browser.storage.local.get('worldactivitykey').then((result) => {
	const worldActivityKey = result.worldactivitykey || 'F';
	keys[worldActivityKey] = () => {
		if (urlParameters['reliant'] !== 'main') window.location.href = '/page=activity/view=world/filter=move+member+endo';
		else (document.querySelector('#update-world-happenings') as HTMLInputElement).click();
	};
});

browser.storage.local.get('refreshkey').then((result) => {
	const refreshKey = result.refreshkey || 'C';
	keys[refreshKey] = () => {
		if (urlParameters['reliant'] === 'main') (document.querySelector('#update-region-status') as HTMLInputElement).click();
		else location.reload();
	};
});

browser.storage.local.get('settingskey').then((result) => {
	const settingsKey = result.settingskey || '0';
	keys[settingsKey] = () => {
		window.location.href = '/page=blank/reliant=settings';
	};
});

browser.storage.local.get('prepkey').then((result) => {
	const prepKey = result.prepkey || 'P';
	keys[prepKey] = () => {
		if (urlParameters['reliant'] === 'prep') (document.querySelector('#prep-button') as HTMLInputElement).click();
		else window.location.href = '/template-overall=none/page=blank/reliant=prep';
	};
});

/*
 * Miscellaneous
 */

const settingsParent = document.querySelector('.belspacer.belspacermain');
if (settingsParent) {
	// Settings Button
	let settingsDiv: HTMLDivElement = document.createElement('div');
	settingsDiv.setAttribute('class', 'bel');
	let settingsButton: HTMLInputElement = document.createElement('input');
	settingsButton.setAttribute('type', 'button');
	settingsButton.setAttribute('id', 'reliant-settings');
	settingsButton.setAttribute('class', 'ajaxbutton');
	settingsButton.value = 'Reliant Settings';
	settingsDiv.appendChild(settingsButton);

	// Main Reliant Button
	let reliantButton: HTMLInputElement = document.createElement('input');
	reliantButton.setAttribute('type', 'button');
	reliantButton.setAttribute('id', 'reliant-main');
	reliantButton.setAttribute('class', 'ajaxbutton');
	reliantButton.value = 'Reliant';
	settingsDiv.appendChild(reliantButton);
	settingsParent.insertBefore(settingsDiv, settingsParent.firstChild);
	document.querySelector('#reliant-settings').addEventListener('click', (e: MouseEvent) => {
		redirectPage('/page=blank/reliant=settings');
	});
	document.querySelector('#reliant-main').addEventListener('click', (e: MouseEvent) => {
		redirectPage('/template-overall=none/page=blank/reliant=main');
	});

	// Prep Page
	let prepButton: HTMLInputElement = document.createElement('input');
	prepButton.setAttribute('type', 'button');
	prepButton.setAttribute('id', 'reliant-prep');
	prepButton.setAttribute('class', 'ajaxbutton');
	prepButton.value = 'Prep';
	settingsDiv.appendChild(prepButton);
	prepButton.addEventListener('click', (e: MouseEvent) => {
		redirectPage('/template-overall=none/page=blank/reliant=prep');
	});
}

(async () => {
	await setDefaultStorageValues();
	const userAgent = await getStorageValue('useragent');
	await browser.runtime.sendMessage({ userAgent: userAgent });
})();
