// pagination
function pagination(viewmodel) {
    document.querySelector('.navbar').addEventListener('click', e => {
        if (e.target.tagName.toLowerCase() === 'a') {
            e.preventDefault();
            const path = e.target.getAttribute('href');
            fetchPage(path).then(() => {
                viewmodel.init;
            })
        }
    });

    async function fetchPage(path) {
        const response = await fetch(path);
        const text = await response.text();
        document.querySelector('.bodycontainer').innerHTML = text;
    }
}


// viewmodel
class ViewModel {
    constructor(model) {
        this.model = model;
        this.viewMapping = {};
        this.arrayTemplate = {};
        this.init();
    }

    // register a view element to viewmodel
    registerView(viewModelKey, viewElement, viewAttribute) {
        // append view element to viewMapping array
        this.viewMapping[viewModelKey] ?
            this.viewMapping[viewModelKey].push({ 'ele': viewElement, 'attr': viewAttribute }) :
            this.viewMapping[viewModelKey] = [{ 'ele': viewElement, 'attr': viewAttribute }];
    }

    // update all view elements
    updateView() {
        // iterate through viewMapping array
        for (let viewModelKey in this.viewMapping) {
            // iterate through view elements
            for (let view of this.viewMapping[viewModelKey]) {

                // update view element
                const ele = view['ele'];
                const attr = view['attr'];

                if (attr == 'innerText') {
                    ele.innerText = this.model[viewModelKey];
                } else if (attr == 'value') {
                    ele.value = this.model[viewModelKey];
                }
                else if (attr == 'array') {
                    if (this.arrayTemplate[ele] == undefined) {
                        this.arrayTemplate[ele] = ele.innerHTML;
                    } else {
                        ele.innerHTML = "";
                    }

                    for (let i = 0; i < this.model[viewModelKey].length; i++) {
                        const itemViewmodel = this.model[viewModelKey][i];

                        const itemele = document.createElement('items');
                        itemele.innerHTML = this.arrayTemplate[ele];

                        // 템플릿 데이터 채워넣기
                        // loop through all children
                        itemele.querySelectorAll('[arraybind]').forEach((subchild) => {
                            const [key, subattr] = subchild.getAttribute('arraybind').split(':');
                            if (subattr == 'innerText') {
                                subchild.innerText = itemViewmodel[key];
                            }
                            else if (subattr == 'value') {
                                subchild.value = itemViewmodel[key];
                            }
                            else {
                                subchild.setAttribute(subattr, itemViewmodel[key]);
                            }
                        })

                        ele.appendChild(itemele);
                    }


                }
                else {
                    ele.setAttribute(attr, this.model[viewModelKey]);
                }
            }
        }
    }

    // initialize
    // mapping all view elements to viewmodel "b-*" attributes
    bindingView() {
        document.querySelectorAll('[databind]').forEach((element) => {
            let [viewModelKey, viewAttribute] = element.getAttribute('databind').split(':');
            this.registerView(viewModelKey, element, viewAttribute);
        });
    }
    init() {
        this.bindingView();
        this.updateView();
    }
}



// function to make a proxy viewmodel instance
function viewmodelProxy(model) {

    const viewmodel = new ViewModel(model);

    const viewmodelproxy = new Proxy(viewmodel, {
        set: function (target, key, value) {
            console.log("call set method")
            // value isarray
            if (Array.isArray(value)) {
                for (let i = 0; i < value.length; i++) {
                    value[i]['id'] = i;
                }
            }
            target.model[key] = value;
            target.updateView();
            return true;
        },
        get: function (target, key) {
            if (key == 'init') {
                target.init();
                return
            }
            return target.model[key];
        }
    });

    return viewmodelproxy;
}


function fetchapis(urls) {
    for (viewmodelname in urls) {
        fetch(urls[viewmodelname])
            .then(response => response.json())
            .then(data => {
                viewmodel[viewmodelname] = data
            })
    }
}