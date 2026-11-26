import "./styles.css";
import { loadEducation } from "./education";
import { mountNavigation } from "./navigation";

mountNavigation("education");
void loadEducation();
