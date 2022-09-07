import './Hud.css';
import React from 'react';
import { getComponents, fetchImage } from './HudDataManager';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { ClipLoader } from 'react-spinners';

class Hud extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      componentPaneMaximized: false,
      classes: {
        componentPane: "component-pane-minimized"
      },
      components: [],
      images: [],
      activeComponent: null
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
        components: components
      })
      this.fetchImages(components)
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

  render() {
    const components = this.state.components.slice(10);
    const mainComponents = this.state.components.slice(0, 10)

    return (
      <div id="component-pane" className={this.state.classes.componentPane} >
        <div id="expander-container">
          <button id="expander" onClick={this.toggleComponentPane.bind(this)}> 
            {this.state.componentPaneMaximized
            ? <ArrowDropDownIcon />
            : <ArrowDropUpIcon />
            }
            
          </button>
        </div>
        {mainComponents.map((component, i) => {
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
        {components.map((component, i) => {
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
    );
  }
}

export default Hud;
