import './Hud.css';
import React from 'react';
import { getComponents, fetchImage } from './HudDataManager';

class Hud extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      componentPaneMaximized: false,
      classes: {
        componentPane: "component-pane-minimized"
      },
      components: [],
      images: []
    }
  } 

  componentDidMount() {
    this.fetchComponents();
  }
  
  fetchComponents() {
    getComponents().then(response => {
      this.setState({
        components: response.results
      })
      this.fetchImages(response.results)
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
    this.setState({
      componentPaneMaximized: !this.state.componentPaneMaximized,
      classes: {
        componentPane: this.state.componentPaneMaximized ? "component-pane-minimized-animated" : "component-pane-maximized" // has not been updated yet so logic is flipped
      }
    })
  }

  minimizeComponentPane() {
    this.setState({
      componentPaneMaximized: false,
      classes: {
        componentPane: "component-pane-minimized-animated"
      }
    })
  }

  updateComponent(i) {
    var component = this.state.components[i]
    var image = this.state.images[component.id]
    if (image) {
      component.localUrl = image
    }

    window.updateActiveComponent(component)
    this.minimizeComponentPane()
  }

  render() {
    return (
      <div className={this.state.classes.componentPane} id="component-pane">
        <button onClick={this.toggleComponentPane.bind(this)}>^</button> <br/>
        {this.state.components.map((component, i) => {
          return (
            <button key={i} onClick={this.updateComponent.bind(this, i)}>
              {this.state.images[component.id] &&
                <img key={i} width={55} height={55} src={this.state.images[component.id]}></img>
              }
            </button>
          )
        })}
      </div>
    );
  }
}

export default Hud;
