const input = document.querySelector("input");
const loading = document.querySelector(".loading")

document.body.addEventListener('click', function(e) {
    if (e.target.tagName === "TEXTAREA") {
        e.target.select();
    }
})

function splitTable(arr, n) {
    var res = [];
    while (arr.length) {
      res.push(arr.splice(0, n));
    }
    return res;
}

async function generatePaletteAndTabIndex(imgData, img) {
    //generowanie palety i tablicy indexów w jednej pętli
    //by bylo szybciej
    const palette = [];
    const tabIndex = [];

    imgData.forEach(pxl => {
        let alpha = 0;
        if (pxl.a !== 0) {
            alpha = 255 / pxl.a;
        }
        const rgba = `rgba(${pxl.r},${pxl.g},${pxl.b},${alpha})`
        if (!palette.includes(rgba)) {
            palette.push(rgba);
            tabIndex.push(palette.length-1);
        } else {
            tabIndex.push(palette.findIndex(el => el === rgba))
        }
    })

    const tabIndexSplit = splitTable(tabIndex, img.width);

    return {
        tabIndex : tabIndexSplit,
        palette : palette
    };
}

async function showFile(canvas, img) {
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0)
}

async function readCanvasData(canvas) {
    const ctx = canvas.getContext('2d');

    return new Promise(function(resolve, reject) {
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const dataTab = [];
        for (let i=0; i<data.data.length; i+=4) {
            const pxl = {
                r : data.data[i],
                g : data.data[i+1],
                b : data.data[i+2],
                a : data.data[i+3]
            }
            dataTab.push(pxl)
        }
        resolve(dataTab);
    })
}

async function readFile(file) {
    return new Promise(function(resolve, reject) {
        const fr = new FileReader();
        fr.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                resolve(img)
            }
            img.src = e.target.result;
        };
        fr.onerror = function(err) {
            reject(err)
        }
        fr.readAsDataURL(file)
    });
}

function createElement(file) {
    const div = document.createElement('div');
    div.classList.add('element-cnt')
    div.innerHTML = `
        <strong class="element-title">${file.name}</strong>
        <canvas class="canvas"></canvas>
        <div class="textarea-cnt">
            <div>
                <strong class="label">Paleta kolorów:</strong>
                <textarea class="textareaPalette"></textarea>
            </div>
            <div>
                <strong class="label">Indeksy kolorów:</strong>
                <textarea class="textareaIndexes"></textarea>
            </div>
        </div>
    `;
    const container = document.querySelector('.container');
    container.appendChild(div);
    return div;
}

function createSummaryElement(allPalettes, allIndexTables) {
    const div = document.createElement('div');
    div.classList.add('element-cnt')
    div.classList.add('element--summary');
    div.innerHTML = `
        <strong class="element-title">Podsumowanie</strong>
        <div class="textarea-cnt">
            <div>
                <strong class="label">Paleta kolorów z pierwszej grafiki:</strong>
                <textarea class="textareaPalette"></textarea>
            </div>
            <div>
                <strong class="label">Indeksy zsumowane:</strong>
                <textarea class="textareaIndexes"></textarea>
            </div>
        </div>
    `;

    const textareaPalette = div.querySelector('.textareaPalette');
    textareaPalette.value = `[${allPalettes.join(",\n")}]`;

    const textareaIndex = div.querySelector('.textareaIndexes');
    textareaIndex.value = `[${allIndexTables.join(",\n")}]`

    return div;
}

input.addEventListener('change', async function() {
    loading.style.display = "inline-block";
    this.disabled = true;

    const allPalettes = [];
    const allIndexTables = [];

    document.querySelector('.container').innerHTML = "";

    for (const file of this.files) {
        const img = await readFile(file);
        const div = createElement(file);
        const canvas = div.querySelector('canvas');
        const paletteTextarea = div.querySelector('.textareaPalette');
        const indexTextarea = div.querySelector('.textareaIndexes');
        canvas.width = img.width;
        canvas.height = img.height;

        const show = await showFile(canvas, img); //pokazuje obrazek
        const data = await readCanvasData(canvas); //czyta dane obrazka z canvas
        const paletteAndTab = await generatePaletteAndTabIndex(data, img); //generuje palete i tablice indexow
        const palette = paletteAndTab.palette;
        const tabIndex = paletteAndTab.tabIndex;

        const paletteStr = `["${palette.join('","')}"]`;
        allPalettes.push(paletteStr)
        paletteTextarea.value = paletteStr;

        const indexStr = `[[${tabIndex.join('],[')}]]`;
        allIndexTables.push(indexStr)
        indexTextarea.value = indexStr;
    }

    const summary = createSummaryElement(allPalettes, allIndexTables);
    const container = document.querySelector('.container');
    container.prepend(summary);

    loading.style.display = "none";
    this.disabled = false;
})