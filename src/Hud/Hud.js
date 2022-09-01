import './Hud.css';
import React from 'react';
import { getComponents } from './HudDataManager';

class Hud extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      componentPaneMaximized: false,
      classes: {
        componentPane: "component-pane-minimized"
      },
      components: []
    }
  } 

  componentDidMount() {
    this.fetchComponents();
  }
  
  fetchComponents() {
    getComponents().then(response =>{
      this.setState({
        components: response.results
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

  updateComponent(i) {
    window.updateActiveComponent(this.state.components[i])
  }

  render() {
    return (
      <div className={this.state.classes.componentPane} id="component-pane">
        <button onClick={this.toggleComponentPane.bind(this)}>^</button> <br/>
        {this.state.components.map((component, i) => {
          return (<button key={i} onClick={this.updateComponent.bind(this, i)}><img key={i} width={48} height={48} src={component.icon}></img></button>)
        })}
      </div>
    );
  }
}

export default Hud;
