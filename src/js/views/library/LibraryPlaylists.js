
import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Link } from 'react-router'

import List from '../../components/List'
import Header from '../../components/Header'

import * as mopidyActions from '../../services/mopidy/actions'
import * as spotifyActions from '../../services/spotify/actions'

class LibraryPlaylists extends React.Component{

	constructor(props) {
		super(props);
	}

	render(){
		if( !this.props.playlists ) return null
		var columns = [
			{ name: 'name', width: '50'},
			{ name: 'uri', width: '25'}
		]

		return (
			<div className="view library-playlists-view">

				<Header icon="playlist" title="My playlists" />

				<section className="list-wrapper">
					<List columns={columns} rows={this.props.playlists} link_prefix="/playlist/" />
				</section>

			</div>
		)
	}
}


/**
 * Export our component
 *
 * We also integrate our global store, using connect()
 **/

const mapStateToProps = (state, ownProps) => {
	return {
		playlists: state.ui.playlists
	}
}

export default connect(mapStateToProps)(LibraryPlaylists)