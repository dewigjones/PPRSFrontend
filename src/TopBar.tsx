import Avatar, { User } from "./Avatar";
export default function TopBar({id, name, img_path}: User) {
    return(
      <div className="topbar">
        <img src="logo.png" className="topbar-logo"/>
        <div className="topbar-title">PPRS</div>
        <Avatar id={id} name={name} img_path={img_path}/>
      </div>  
    );
}