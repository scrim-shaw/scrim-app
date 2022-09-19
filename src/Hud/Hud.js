import './Hud.css';
import React from 'react';
import { getComponents, fetchImage } from './HudDataManager';
import { TextField, InputAdornment, Snackbar, Alert, Backdrop, CircularProgress, IconButton, ButtonGroup, Button, Tooltip, Typography, styled } from '@mui/material';
import { ClickAwayListener } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { ClipLoader } from 'react-spinners';

const ColorButton = styled(Button)(({ activecolor }) => ({
  backgroundColor: activecolor,
  '&:hover': {
    backgroundColor: activecolor,
  },
}));

class Hud extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      componentPaneMaximized: false,
      classes: {
        componentPane: "component-pane-minimized"
      },
      components: [],
      tools: [],
      mainComponents: [],
      miscComponents: [],
      images: [],
      activeComponent: null,
      snackbarOpen: true,
      backdropLoaderOpen: true,
      colorSelectOpen: false,
      color: "#3498db"
    }

    window.activeComponentUpdated = this.activeComponentUpdated.bind(this)
  }

  activeComponentUpdated(componentId) {
    this.setState({
      activeComponent: componentId
    })
  }

  componentDidMount() {
    this.setupAnalytics();
    this.fetchComponents();

    this.selectColor("#3498db")
  }

  setupAnalytics() {
    const script = document.createElement("script");

    script.src = "https://www.googletagmanager.com/gtag/js?id=G-7496DWME29";
    script.async = true;

    document.body.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    
    this.gtag('js', new Date());

    this.gtag('config', 'G-7496DWME29');
  }
  
  gtag(){
    window.dataLayer.push(arguments);
  }
  
  fetchComponents() {
    getComponents().then(components => {
      this.setState({
        components: components.allResults,
        tools: components.tools, 
        mainComponents: components.mainComponents,
        miscComponents: components.miscComponents,
        backdropLoaderOpen: false
      })
      this.fetchImages(components.allResults)
    }) 
  }

  fetchImages(components) {
    components.forEach(component => {
      fetchImage(component.icon).then(url => {
        var images = this.state.images;
        images[component.id] = url

        this.setState({images: images})
      })
    })
  }

  toggleComponentPane() {
    const componentPaneMaximized = !this.state.componentPaneMaximized
    this.setState({
      componentPaneMaximized: componentPaneMaximized,
      classes: {
        componentPane: componentPaneMaximized ? "component-pane-maximized" : "component-pane-minimized-animated" // has not been updated yet so logic is flipped
      }
    })
  }

  minimizeComponentPane() {
    if (this.state.componentPaneMaximized) {
      this.setState({
        componentPaneMaximized: false,
        classes: {
          componentPane: "component-pane-minimized-animated"
        }
      })
    }
  }

  updateComponent(id) {
    var component = this.state.components.find(component => { return component.id === id })

    this.gtag('event', 'clicked_component', {
      'componentId': component.id,
      'componentName': component.name
    });

    if (component) {
      var image = this.state.images[component.id]
      if (image) {
        component.localUrl = image
      }

      window.updateActiveComponent(component)
      this.minimizeComponentPane()
    }
  }

  clearCanvas() {
    window.clearCanvas();
  }

  handleClose(event, reason) {
    if (reason === 'clickaway') {
      return;
    }

    this.setState({
      snackbarOpen: false
    })
  };

  openColorSelect() {
    this.setState({
      colorSelectOpen: true
    })
  }

  selectColor(color) {
    if (color === null) {color = this.state.color}
    const colorNum = parseInt(color.replace(/^#/, ''), 16)
    window.updateParams({
      color: colorNum
    })
    this.setState({
      colorSelectOpen: false,
      color: color
    })
  }

  render() {
    return (
      <>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={this.state.snackbarOpen}
      >
        <Alert variant="filled" onClose={this.handleClose.bind(this)} severity="info" sx={{ width: '100%' }}>
          <span id="hint-text">Hint: While dragging a component or two, press the spacebar to duplicate it.</span>
        </Alert>
      </Snackbar>
      <div id="convenience-buttons">
      <ButtonGroup variant="contained">
        <IconButton onClick={this.clearCanvas.bind(this)} color="primary" aria-label="delete" size="medium">
          <DeleteIcon fontSize="inherit" />
        </IconButton>
        <ClickAwayListener onClickAway={this.selectColor.bind(this, null)}>
          <Tooltip open={this.state.colorSelectOpen} title={
            <React.Fragment>
              <ButtonGroup variant="contained">
                <ColorButton onClick={this.selectColor.bind(this, "#3498db")} activecolor="#3498db"><p></p></ColorButton>
                <ColorButton onClick={this.selectColor.bind(this, "#9b59b6")} activecolor="#9b59b6"><p></p></ColorButton>
                <ColorButton onClick={this.selectColor.bind(this, "#2ecc71")} activecolor="#2ecc71"><p></p></ColorButton>
                <ColorButton onClick={this.selectColor.bind(this, "#e67e22")} activecolor="#e67e22"><p></p></ColorButton>
                <ColorButton onClick={this.selectColor.bind(this, "#e74c3c")} activecolor="#e74c3c"><p></p></ColorButton>
                <ColorButton onClick={this.selectColor.bind(this, "#f1c40f")} activecolor="#f1c40f"><p></p></ColorButton>
              </ButtonGroup>
            </React.Fragment>
          }>
            <ColorButton onClick={this.openColorSelect.bind(this)} activecolor={this.state.color}></ColorButton>
          </Tooltip>
        </ClickAwayListener>
      </ButtonGroup>
      
      </div>
      <div id="tool-pane">
        {this.state.tools.map((component, i) => {
          if (this.state.images[component.id]) {
            return (
              <button className={'tool-button' + (this.state.activeComponent === component.id ? " component-button-active" : "")} key={component.id} onClick={this.updateComponent.bind(this, component.id)}>
                {this.state.images[component.id] &&
                  <img key={component.id} width={35} height={35} src={this.state.images[component.id]}></img>
                }
              </button>
            )
          } else {
            return (
              <ClipLoader key={component.id} className="component-loader" loading={true} size={55}></ClipLoader>
            )
          }
        })}
      </div>
      <div id="component-pane" className={this.state.classes.componentPane} >
        <div id="expander-container">
          <button id="expander" onClick={this.toggleComponentPane.bind(this)}> 
            {this.state.componentPaneMaximized
            ? <ArrowDropDownIcon />
            : <ArrowDropUpIcon />
            }
            
          </button>
        </div>
        {this.state.mainComponents.map((component, i) => {
          if (this.state.images[component.id]) {
            return (
              <button className={'component-button' + (this.state.activeComponent === component.id ? " component-button-active" : "")} key={component.id} onClick={this.updateComponent.bind(this, component.id)}>
                {this.state.images[component.id] &&
                  <img key={component.id} width={55} height={55} src={this.state.images[component.id]}></img>
                }
              </button>
            )
          } else {
            return (
              <ClipLoader key={component.id} className="component-loader" loading={true} size={55} ></ClipLoader>
            )
          }
        })}
        <div>
          <TextField 
            sx={{marginLeft: "60px", marginTop: "20px", marginBottom: "20px", width: "calc(100% - 120px)"}} 
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon/>
                </InputAdornment>
              )
            }} 
            placeholder="Search for components"
            id="component-search" 
            variant="outlined" 
          />
        </div>
        {this.state.miscComponents.map((component, i) => {
          if (this.state.images[component.id]) {
            return (
              <button className={'component-button' + (this.state.activeComponent === component.id ? " component-button-active" : "")} key={component.id} onClick={this.updateComponent.bind(this, component.id)}>
                {this.state.images[component.id] &&
                  <img key={component.id} width={55} height={55} src={this.state.images[component.id]}></img>
                }
              </button>
            )
          } else {
            return (
              <ClipLoader key={component.id} className="component-loader" loading={true} size={55}></ClipLoader>
            )
          }
        })}
      </div>
      <Backdrop
          open={this.state.backdropLoaderOpen}
        >
        <CircularProgress />
      </Backdrop>
      </>
    );
  }
}

export default Hud;
