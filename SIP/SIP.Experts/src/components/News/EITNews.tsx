import * as React from 'react'
import request = require('esri/request');
import { eitAppConfig } from '../../eitAppConfig';
import OverlayLoader from '../../core/components/Loading/OverlayLoading';
import { nls } from '../../core/components/nls';

interface News {
    title: string;
    body: string;
    title_en: string;
    body_en: string;
    publishdate: Date;
}

interface Props {

}

interface State {
    isLoading: boolean;
    isError: boolean;
    hasMore: boolean;
    resultOffset: number;
    resultRecordCount: number;
    news: Array<News>;
}

export default class EITNews extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            isLoading: false,
            isError: false,
            hasMore: true,
            resultOffset: 0,
            resultRecordCount: 5,
            news: []
        }
    }

    componentWillMount() {
        this.loadNews();
    }

    loadNews = () => {
        this.setState({ isLoading: true, isError: false }, () => {
            request(eitAppConfig.layers.News + "/query", {
                query: {
                    f: "json",
                    where: "newsstatus=1",
                    outFields: ["title, body, title_en, body_en, publishdate"],
                    returnGeometry: false,
                    orderByFields: "objectid desc",
                    resultOffset: this.state.resultOffset,
                    resultRecordCount: 10
                }
            })
                .then(({ data }) => {
                    if (data && data.features) {
                        let news = data.features.map((el: any) => el.attributes as News);
                        this.setState({
                            ...this.state,
                            isLoading: false,
                            hasMore: data.features.length == this.state.resultRecordCount,
                            news: this.state.news.concat(news),
                            resultOffset: this.state.resultOffset + this.state.resultRecordCount
                        })
                    } else
                        throw Error()
                }).catch(e => {
                    this.setState({
                        ...this.state,
                        isLoading: false,
                        isError: true
                    })
                })
        })
    }

    handleScroll = (el: any) => {
        if (el.target.scrollTop + el.target.offsetHeight >= el.target.scrollHeight) {
            if (!this.state.isLoading && this.state.hasMore)
                this.loadNews();
        }
    }

    formatDate(date: Date) {
        if (date) {
            let d = new Date(date)
            if (d && String(d) !== 'Invalid Date')
                return `${d.getDate()}.${(d.getMonth() + 1)}.${d.getFullYear()}`;
        }
        return undefined;
    }

    render() { 
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", height: "100%", margin: "5px" }}>
                <OverlayLoader size="60px" show={this.state.isLoading} />
                <div onScroll={(el) => this.handleScroll(el)} id="newsContainer" style={{ overflow: "auto", overflowX: "hidden", scrollBehavior: "smooth", flexGrow: 1, flexShrink: 1, flexBasis: "10px" }}>
                    {this.state.news.map((n, i) => {
                        return <React.Fragment key={i}>
                            <span>{this.formatDate(n.publishdate)}</span>
                            <br />
                            <span style={{ color: "#00368c", fontSize: "1em", fontWeight: "bold" }}>
                                {nls.langKey=='en' ?  (  n.title_en && n.title_en.trim() != '' ? n.title_en :  n.title): n.title}
                            </span>
                            <p> {nls.langKey=='en' ?  (  n.body_en && n.body_en.trim() != '' ? n.body_en :  n.body): n.body}</p>
                            <br />
                        </React.Fragment>
                    })}
                     {this.state.isError ?
                    <div style={{ width: "100%", fontSize: "17px", color: "red", marginTop: 5, backgroundColor: "#3h3h3h" }}>
                        {nls.nls.general.errorOccured}
                    </div> : null}
                </div>
            </div>
        )
    }
}
