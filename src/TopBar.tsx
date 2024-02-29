import Avatar from "./Avatar";
export default function TopBar() {
    return(
      <div className="topbar">
        <img src="logo.png" className="topbar-logo"/>
        <div className="topbar-title">PPRS</div>
        <Avatar id={0} name="Gruff" img_path="Gruff.jpg"/>
      </div>  
    );
}