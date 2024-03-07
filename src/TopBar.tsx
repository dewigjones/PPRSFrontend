import Avatar, { User } from "./Avatar";

export interface topbar {
  user: User,
  avatarHandler: () => void;
};

export default function TopBar({user, avatarHandler}: topbar) {
    return(
      <div className="topbar">
        <img src="logo.png" className="topbar-logo"/>
        <div className="topbar-title">PPRS</div>
        <div onClick={avatarHandler}>
          <Avatar id={user.id} name={user.name} img_path={user.img_path}/>
        </div>
      </div>  
    );
}