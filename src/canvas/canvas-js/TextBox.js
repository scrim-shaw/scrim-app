import { Text } from 'pixi.js';

export class TextBox extends Text {
    constructor(text, style) {
        super(text, style)
        this.initialStyle = style

        this._textArea = document.getElementById('edit-text')
    }

    edit() {
        this.editing = true
        
        this._textArea.style.display = 'inline'
        this._textArea.textContent = this.text;
        this._textArea.value = this.text;
        this._textArea.autofocus = true;
        this._textArea.placeholder = 'text...'
        this.visible = false;
        const left = this.x - (this.width/2)
        const top = this.y - (this.height/2)

        this.originalLeft = left
        this.originalTop = top

        this.editWidth = 500;

        //this.width = this.editWidth
        this.x = this.originalLeft + (this.width / 2)
        this.y = this.originalTop + (this.height / 2)

        const style = {
            position: 'absolute',
            background: 'none',
            border: 'none',
            outline: 'none',
            left: left+'px',
            top: top+'px',
            width: this.editWidth+'px',
            height: this.height+'px',
            lineHeight: '1',
            resize: 'none',
            "font-family" : 'Arial',
            "font-size" : "24px",
        }

        for (let key in style) {
            this._textArea.style[key] = style[key]
        }
        
        document.body.appendChild(this._textArea);

        this._textArea.focus();
        this._textArea.setSelectionRange(0, this.text.length)

        this.startListeners();
    }

    startListeners() {
        this.listener = this._onInputInput.bind(this)
        this._textArea.addEventListener('input', this.listener)
    }

    stopListeners() {
        this._textArea.removeEventListener('input', this.listener)
    }

    stopEditing() {
        // var sampleText = new Text(this.text, this.initialStyle)

        this.editing = false
        this._textArea.style.display = 'none'
        // this.width = sampleText.width
        // this.height = sampleText.height
        this.x = this.originalLeft + (this.width / 2)
        this.y = this.originalTop + (this.height / 2)
        this.visible = true;

        this.componentData.content = this.text

        // sampleText = null
        this.stopListeners();
    }

    _onInputInput(e) {
        this._textArea.style.height = "1px";
        this._textArea.style.height = (25+this._textArea.scrollHeight)+"px";
        var t = this._textArea.value
        this.text = this._textArea.value

        // var sampleText = new Text(this.text, this.initialStyle)

        //this.width = this.editWidth
        // this.width = sampleText.width
        // this.height = sampleText.height

        this.x = this.originalLeft + (this.width / 2)
        this.y = this.originalTop + (this.height / 2)

        // sampleText = null
    }
}